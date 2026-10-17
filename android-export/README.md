# A.T.L.A.S. - Native Android (Samsung Galaxy) Export Guide

This document explains how to export this A.T.L.A.S. web application into a native Android APK and run the native Kotlin Foreground Microphone Service on your Samsung Galaxy device.

---

## 1. Environment Status & Platform Clarification

- **Current Environment**: This AI Studio container provides a high-performance **Full-Stack Web Environment (Vite + React + Express Node.js)**.
- **Android Compilation**: Native Android compilation (`gradlew assembleDebug` or Jetpack Compose builds) requires the Android SDK, JDK 17+, and AAPT2 build tools, which are not hosted inside this web runtime.
- **Path Forward**: We have architected A.T.L.A.S. with a dual-layer design:
  1. A fully functioning, responsive tactical HUD web app running right here in your browser.
  2. Complete, copyable native Kotlin files (`AtlasVoiceForegroundService.kt`), `AndroidManifest.xml`, and Capacitor configuration to generate your native `.apk` in 5 minutes using Android Studio.

---

## 2. Converting to a Native Android APK (Fastest Route: Capacitor 6)

Capacitor packages modern web applications directly into native Android Studio projects while allowing native Kotlin services to run alongside.

### Step-by-Step Commands:

```bash
# 1. In your local terminal, install Capacitor CLI and Core
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android

# 2. Initialize Capacitor project
npx cap init "A.T.L.A.S." "com.atlas.tactical" --web-dir dist

# 3. Build the frontend web distribution
npm run build

# 4. Add the Android platform
npx cap add android

# 5. Copy the Foreground Service & Manifest:
# Copy `android-export/AtlasVoiceForegroundService.kt` to:
#   android/app/src/main/java/com/atlas/tactical/service/AtlasVoiceForegroundService.kt
# Merge `android-export/AndroidManifest.xml` into:
#   android/app/src/main/AndroidManifest.xml

# 6. Open in Android Studio and build APK
npx cap open android
```

In Android Studio:
- Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
- Or plug in your Samsung Galaxy via USB (enable Developer Options & USB Debugging) and click **Run 'app'**.

---

## 3. Native Android Background Microphone Restrictions (Deep Dive)

Android enforces strict privacy protections around the microphone. Here is the technical breakdown:

### A. Android 9 (API 28) - Microphone Isolation
Starting in Android 9, apps running in the background (no visible UI) are prevented from reading data from `AudioRecord` or `MediaRecorder`. If an app attempts to read audio in the background without a foreground service, the system returns silent audio or zeros.

### B. Android 14+ (API 34) - Strict Foreground Service Types
Android 14 mandates that every foreground service declare its specific purpose:
```xml
<service
    android:name=".service.AtlasVoiceForegroundService"
    android:foregroundServiceType="microphone"
    android:exported="false" />
```
And in Kotlin:
```kotlin
startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
```
Failure to declare `FOREGROUND_SERVICE_TYPE_MICROPHONE` results in immediate `SecurityException` crashes when calling `startForeground()`.

### C. Persistent User Notification
Android OS requires a visible, non-dismissible notification in the status bar whenever a foreground microphone service is running. This informs the user that audio monitoring is occurring. Our service includes quick "Mute Mic" and "Terminate" action buttons directly in the notification drawer.

### D. Samsung One UI Aggressive Sleep Policies
Samsung devices (Galaxy S21, S22, S23, S24, Z Fold, etc.) feature an aggressive power manager ("Device Care"). If an app is running in the background for more than 5-10 minutes, Samsung OS will kill the background process unless the user adds it to "Never Sleeping Apps" or approves the battery optimization exemption:
```kotlin
val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
    data = Uri.parse("package:$packageName")
}
startActivity(intent)
```

---

## 4. The Truth About "Hey Atlas" Wake-Word Detection

### Why Web Browsers Cannot Do True Screen-Off Wake-Words:
- When your phone screen turns off or the browser is minimized, web browsers suspend JavaScript event loops and media streams to conserve battery.
- Web Speech API (`webkitSpeechRecognition`) requires an active internet connection, stops automatically after silence, and cannot run continuously in the background on mobile browsers.

### How Real Native Wake-Words Work:
In native Android, true continuous wake-word listening requires:
1. **Offline Embedded Model**: Running a lightweight DSP hotword engine on the device CPU/NPU (such as Picovoice Porcupine or OpenWakeWord).
2. **Foreground Audio Thread**: The `AtlasVoiceForegroundService.kt` provided in this directory reads 512-sample PCM chunks at 16kHz and feeds them to the hotword engine without uploading raw audio to the cloud.
3. **Power Consumption**: Continuous listening on the main CPU consumes ~4-8% battery per hour unless utilizing low-power DSP hardware (which Qualcomm/Samsung reserves for Google Assistant and Samsung Bixby via `VoiceInteractionService` / `AlwaysOnHotwordDetector`).
