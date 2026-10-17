import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, Terminal, ShieldAlert, Cpu, Download, FileCode, Layers, Info } from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'service' | 'manifest' | 'restrictions' | 'commands'>('overview');

  if (!isOpen) return null;

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const kotlinServiceSnippet = `package com.atlas.tactical.service

import android.app.*
import android.content.*
import android.content.pm.ServiceInfo
import android.media.*
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.util.concurrent.atomic.AtomicBoolean

class AtlasVoiceForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "atlas_tactical_voice_channel"
        const val NOTIFICATION_ID = 4040
        const val SAMPLE_RATE = 16000
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var audioRecord: AudioRecord? = null
    private val isRecording = AtomicBoolean(false)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()

        // Android 14+ (API 34) mandates FOREGROUND_SERVICE_TYPE_MICROPHONE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        startAudioCapture()
        return START_STICKY // Samsung One UI: Keep alive
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("A.T.L.A.S. Tactical Core")
            .setContentText("ACTIVE VOICE SENSOR // Monitoring Neural Vector")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
    }
    // ... Full implementation provided in /android-export/AtlasVoiceForegroundService.kt
}`;

  const manifestSnippet = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.atlas.tactical">

    <!-- Crucial for Samsung Galaxy background listening -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <application
        android:label="A.T.L.A.S."
        android:theme="@style/Theme.AtlasTactical">

        <!-- Foreground Service declared with microphone serviceType for Android 14+ -->
        <service
            android:name=".service.AtlasVoiceForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />
    </application>
</manifest>`;

  const cliCommands = `# 1. Install Capacitor CLI & Android runtime
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android

# 2. Initialize Capacitor project for ATLAS
npx cap init "A.T.L.A.S." "com.atlas.tactical" --web-dir dist

# 3. Build Web Bundle
npm run build

# 4. Generate Native Android Studio Project
npx cap add android

# 5. Open in Android Studio & Compile APK
npx cap open android`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#040d1a] border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.3)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Corner Brackets */}
        <div className="corner-bracket-tl" />
        <div className="corner-bracket-tr" />
        <div className="corner-bracket-bl" />
        <div className="corner-bracket-br" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-cyan-950/30">
          <div className="flex items-center gap-2.5 font-orbitron font-bold text-cyan-200">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <span>SAMSUNG GALAXY // NATIVE APK EXPORT HUB</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-cyan-500/20 bg-[#030914] text-xs font-mono-hud overflow-x-auto">
          {[
            { id: 'overview', label: 'ENVIRONMENT & PLAN', icon: Info },
            { id: 'service', label: 'KOTLIN SERVICE', icon: FileCode },
            { id: 'manifest', label: 'ANDROID MANIFEST', icon: Layers },
            { id: 'restrictions', label: 'ANDROID 14+ RULES', icon: ShieldAlert },
            { id: 'commands', label: 'CLI EXPORT SCRIPT', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2.5 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-rajdhani text-sm">
          {/* OVERVIEW TAB */}
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                <div className="font-orbitron font-bold text-cyan-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>ENVIRONMENT STATUS CLARIFICATION</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  This development container is a <strong>Node.js + React + Express Full-Stack Web Runtime</strong>. Because Android SDK, Gradle daemons, and Java JDK 17 are not hosted inside the browser sandbox, <em>direct in-browser compilation of Kotlin .apk files is not physically possible in this cloud workspace</em>.
                </p>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  Instead, we have engineered <strong>two parallel paths for your Samsung Galaxy</strong>:
                </p>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Instant PWA Installation:</strong> Install directly on Samsung Internet / Chrome as a full-screen, standalone app with home screen icon.</li>
                  <li><strong>Native Capacitor APK (Recommended):</strong> Use the export files created in <code className="text-cyan-300">/android-export/</code> to compile a real native Android Studio APK with the native Kotlin Foreground Microphone Service.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-hud text-xs">
                <div className="p-3 rounded-lg bg-[#020610] border border-cyan-500/20">
                  <div className="text-cyan-400 font-bold mb-1">TARGET DEVICE</div>
                  <div className="text-slate-300">Samsung Galaxy S/Z Series</div>
                  <div className="text-slate-500 text-[10px]">One UI 6.0+ (Android 14+)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#020610] border border-cyan-500/20">
                  <div className="text-cyan-400 font-bold mb-1">AUDIO SERVICE</div>
                  <div className="text-slate-300">Foreground Service</div>
                  <div className="text-slate-500 text-[10px]">Type: MICROPHONE</div>
                </div>
                <div className="p-3 rounded-lg bg-[#020610] border border-cyan-500/20">
                  <div className="text-cyan-400 font-bold mb-1">LOCAL EXPORT CODE</div>
                  <div className="text-slate-300">/android-export/</div>
                  <div className="text-slate-500 text-[10px]">Complete files staged</div>
                </div>
              </div>
            </div>
          )}

          {/* KOTLIN SERVICE TAB */}
          {selectedTab === 'service' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-hud text-cyan-400">
                  FILE: /android-export/AtlasVoiceForegroundService.kt
                </span>
                <button
                  onClick={() => handleCopy('service', kotlinServiceSnippet)}
                  className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono-hud flex items-center gap-1.5 hover:bg-cyan-900 transition-colors"
                >
                  {copiedKey === 'service' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY KOTLIN CODE</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#020610] border border-cyan-500/20 text-[11px] font-mono-hud text-slate-300 overflow-x-auto max-h-72">
                {kotlinServiceSnippet}
              </pre>
              <p className="text-xs text-slate-400">
                This service creates the mandatory ongoing status bar notification and initiates 16kHz PCM audio streaming.
              </p>
            </div>
          )}

          {/* MANIFEST TAB */}
          {selectedTab === 'manifest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-hud text-cyan-400">
                  FILE: /android-export/AndroidManifest.xml
                </span>
                <button
                  onClick={() => handleCopy('manifest', manifestSnippet)}
                  className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono-hud flex items-center gap-1.5 hover:bg-cyan-900 transition-colors"
                >
                  {copiedKey === 'manifest' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY MANIFEST</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#020610] border border-cyan-500/20 text-[11px] font-mono-hud text-slate-300 overflow-x-auto max-h-72">
                {manifestSnippet}
              </pre>
            </div>
          )}

          {/* RESTRICTIONS TAB */}
          {selectedTab === 'restrictions' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2">
                <div className="font-orbitron font-bold text-red-300 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>ANDROID OS BACKGROUND MICROPHONE SECURITY ENFORCEMENT</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>1. Android 9 (API 28)+ Privacy Sandbox:</strong> Background apps without an active foreground service are silenced by the audio HAL. `AudioRecord` produces zero bytes.
                  </p>
                  <p>
                    <strong>2. Android 14 (API 34)+ Service Types:</strong> You MUST declare <code className="text-cyan-300 font-mono">android:foregroundServiceType="microphone"</code> in the manifest AND pass it to <code className="text-cyan-300 font-mono">startForeground()</code>. Otherwise the OS throws a fatal <code className="text-red-400 font-mono">SecurityException</code>.
                  </p>
                  <p>
                    <strong>3. Mandatory Visible Ongoing Notification:</strong> Android policy prohibits any silent background listening. The user must always see an ongoing notification indicating that audio is active.
                  </p>
                  <p>
                    <strong>4. Samsung One UI Deep Sleep Safeguard:</strong> Samsung One UI aggressive battery manager kills background processes after 5-10 minutes. You must request battery exemption via <code className="text-cyan-300 font-mono">ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS</code> so ATLAS stays alive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* COMMANDS TAB */}
          {selectedTab === 'commands' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-hud text-cyan-400">
                  LOCAL TERMINAL EXECUTION (5 MINUTES TO APK)
                </span>
                <button
                  onClick={() => handleCopy('commands', cliCommands)}
                  className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono-hud flex items-center gap-1.5 hover:bg-cyan-900 transition-colors"
                >
                  {copiedKey === 'commands' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY SCRIPT</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#020610] border border-cyan-500/20 text-[11px] font-mono-hud text-cyan-300 overflow-x-auto max-h-72">
                {cliCommands}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/20 flex items-center justify-between">
          <span className="font-mono-hud text-xs text-slate-400">
            Export documentation saved in: /android-export/
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs tracking-wider hover:bg-cyan-400 transition-colors"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};
