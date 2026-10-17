package com.atlas.tactical.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.util.concurrent.atomic.AtomicBoolean

/**
 * AtlasVoiceForegroundService
 *
 * Implements persistent foreground audio streaming and hotword monitoring
 * specifically engineered to comply with Android 14+ (API 34) and Samsung One UI
 * background microphone isolation rules.
 *
 * CRITICAL ANDROID RESTRICTIONS:
 * 1. Android 9 (API 28)+ completely silences AudioRecord when an app enters background
 *    UNLESS it is running an active Foreground Service.
 * 2. Android 14 (API 34)+ REQUIRES specifying FOREGROUND_SERVICE_TYPE_MICROPHONE both in
 *    the AndroidManifest.xml and passed to startForeground().
 * 3. A persistent, non-dismissible user notification is MANDATORY by Android OS security policy.
 * 4. Samsung One UI will aggressively place the app into "Deep Sleeping Apps" after ~10 minutes
 *    unless whitelisted via ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS.
 */
class AtlasVoiceForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "atlas_tactical_voice_channel"
        const val CHANNEL_NAME = "A.T.L.A.S. Tactical Audio Link"
        const val NOTIFICATION_ID = 4040
        const val ACTION_START_LISTENING = "com.atlas.ACTION_START"
        const val ACTION_STOP_LISTENING = "com.atlas.ACTION_STOP"
        const val ACTION_MUTE_MIC = "com.atlas.ACTION_MUTE"
        
        // Audio streaming parameters (16kHz mono 16-bit PCM optimal for voice AI / Porcupine)
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private val isRecording = AtomicBoolean(false)
    private val isMuted = AtomicBoolean(false)

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_LISTENING -> {
                stopForegroundService()
                return START_NOT_STICKY
            }
            ACTION_MUTE_MIC -> {
                isMuted.set(!isMuted.get())
                updateNotification()
                return START_STICKY
            }
            else -> {
                startForegroundWithMicType()
                startAudioCapture()
                return START_STICKY // System will recreate service if killed
            }
        }
    }

    private fun startForegroundWithMicType() {
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            var serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_NONE
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // Android 11+ and Android 14+ mandate explicit microphone type
                serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val stopIntent = Intent(this, AtlasVoiceForegroundService::class.java).apply {
            action = ACTION_STOP_LISTENING
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val muteIntent = Intent(this, AtlasVoiceForegroundService::class.java).apply {
            action = ACTION_MUTE_MIC
        }
        val mutePendingIntent = PendingIntent.getService(
            this, 1, muteIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = if (isMuted.get()) {
            "SENSOR MUTED // Standing by"
        } else {
            "TACTICAL VOICE MONITOR ACTIVE // Neural link online"
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("A.T.L.A.S. Tactical Core")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                android.R.drawable.ic_lock_silent_mode,
                if (isMuted.get()) "Unmute" else "Mute Mic",
                mutePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Terminate",
                stopPendingIntent
            )
            .build()
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun startAudioCapture() {
        if (isRecording.get()) return

        val bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
            return
        }

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION, // Optimal for speech DSP on Samsung devices
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize * 2
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                return
            }

            audioRecord?.startRecording()
            isRecording.set(true)

            recordingThread = Thread({
                val buffer = ShortArray(512)
                while (isRecording.get()) {
                    if (isMuted.get()) {
                        Thread.sleep(100)
                        continue
                    }

                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        // In a production APK with Porcupine or OpenWakeWord:
                        // val keywordIndex = porcupine.process(buffer)
                        // if (keywordIndex >= 0) { onWakeWordDetected() }
                    }
                }
            }, "AtlasVoiceCaptureThread")
            recordingThread?.start()

        } catch (e: SecurityException) {
            // Permission RECORD_AUDIO denied
            stopForegroundService()
        }
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ATLAS:VoiceSensorWakeLock"
        ).apply {
            setReferenceCounted(false)
            acquire(60 * 60 * 1000L) // 1 hour max safeguard
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tactical continuous audio monitoring notification for A.T.L.A.S."
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun stopForegroundService() {
        isRecording.set(false)
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (_: Exception) {}

        wakeLock?.let {
            if (it.isHeld) it.release()
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopForegroundService()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
