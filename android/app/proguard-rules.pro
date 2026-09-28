# ============================================================
# SPECTRA — ProGuard / R8 Rules
# proguard-android-optimize.txt is used as the base config.
# These rules ensure R8 never strips classes that are
# accessed reflectively or from JavaScript via Capacitor.
# ============================================================

# ── Capacitor core bridge ────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# ── All native plugin classes in this package ────────────────
-keep class in.edu.college.spectra.** { *; }

# ── WorkManager workers (accessed via reflection by JobScheduler) ──
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keepclassmembers class * extends androidx.work.Worker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}

# ── BroadcastReceivers declared in AndroidManifest ───────────
-keep class * extends android.content.BroadcastReceiver { *; }

# ── AlarmManager PendingIntents (referenced by action string) ─
-keepnames class in.edu.college.spectra.PeriodSyncReceiver
-keepnames class in.edu.college.spectra.BootReceiver

# ── AndroidX & Jetpack ───────────────────────────────────────
-keep class androidx.core.app.NotificationCompat { *; }
-keep class androidx.core.app.NotificationCompat$Builder { *; }
-dontwarn androidx.core.**
-dontwarn androidx.work.**

# ── Cordova plugins bridge ───────────────────────────────────
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ── Firebase (if used via google-services plugin) ────────────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ── JSON (used by Firestore REST parser in PeriodBackgroundSyncManager) ──
-keep class org.json.** { *; }

# ── Keep WebView JavaScript interface intact ─────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Preserve stack traces for crash debugging ────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Suppress harmless missing-class warnings from transitive deps ──
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
