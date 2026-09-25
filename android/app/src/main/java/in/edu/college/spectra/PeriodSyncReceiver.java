package in.edu.college.spectra;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

/**
 * PeriodSyncReceiver handles AlarmManager triggers while the SPECTRA app is closed or backgrounded.
 *
 * It uses goAsync() + WakeLock to run the Firestore REST network check immediately,
 * guaranteeing instantaneous notification delivery even when the device is locked or in Doze mode.
 * In addition, it enqueues WorkManager as a system-level secondary fallback.
 */
public class PeriodSyncReceiver extends BroadcastReceiver {
    private static final String TAG = "SpectraPeriodReceiver";

    @Override
    public void onReceive(final Context context, Intent intent) {
        if (context == null) return;
        final Context appContext = context.getApplicationContext();
        Log.d(TAG, "PeriodSyncReceiver triggered. Running instant background period check.");

        // 1. Immediate direct check via goAsync() + short WakeLock
        // This ensures zero-delay Firestore polling during deep Doze mode without waiting for WorkManager batching
        final PendingResult pendingResult = goAsync();
        PowerManager pm = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wakeLock = (pm != null)
            ? pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Spectra:PeriodSyncWakeLock")
            : null;
        if (wakeLock != null) {
            try {
                // 25s covers Firestore 7s connect + 7s read + overhead on slow
                // networks; old 8s timeout killed the thread mid-GET on Android
                // 14+ Cached Apps Freezer, losing 2nd+ notifications.
                wakeLock.acquire(25000L); // 25s safety timeout
            } catch (Exception ignored) {}
        }

        new Thread(() -> {
            try {
                PeriodBackgroundSyncManager.performCheck(appContext);
            } catch (Exception e) {
                Log.e(TAG, "Direct background check error", e);
            } finally {
                try {
                    if (wakeLock != null && wakeLock.isHeld()) {
                        wakeLock.release();
                    }
                } catch (Exception ignored) {}
                try {
                    pendingResult.finish();
                } catch (Exception ignored) {}
            }
        }).start();

        // 2. Delegate to WorkManager as secondary OS-level backup
        PeriodSyncWorker.enqueueImmediate(appContext);

        // 3. Re-arm the AlarmManager hardware wakeup heartbeat for the next SYNC_INTERVAL_MS (20s)
        PeriodBackgroundSyncManager.scheduleNextCheck(appContext, PeriodBackgroundSyncManager.SYNC_INTERVAL_MS);
    }
}
