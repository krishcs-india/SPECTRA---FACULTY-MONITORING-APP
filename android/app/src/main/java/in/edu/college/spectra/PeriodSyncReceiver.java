package in.edu.college.spectra;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

public class PeriodSyncReceiver extends BroadcastReceiver {
    private static final String TAG = "SpectraPeriodReceiver";

    @Override
    public void onReceive(final Context context, Intent intent) {
        Log.d(TAG, "PeriodSyncReceiver triggered while app is closed/idle!");
        if (context == null) return;

        final PendingResult pendingResult = goAsync();
        final Context appContext = context.getApplicationContext();

        PowerManager powerManager = (PowerManager) appContext.getSystemService(Context.POWER_SERVICE);
        final PowerManager.WakeLock wakeLock = (powerManager != null)
            ? powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "spectra:PeriodSyncWakeLock")
            : null;

        if (wakeLock != null) {
            try {
                wakeLock.acquire(45000L); // Hold CPU awake for up to 45 seconds for network
            } catch (Exception ignored) {}
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    PeriodBackgroundSyncManager.performCheck(appContext);
                    PeriodBackgroundSyncManager.scheduleNextCheck(appContext, PeriodBackgroundSyncManager.SYNC_INTERVAL_MS);
                } catch (Exception e) {
                    Log.e(TAG, "Background check execution error in receiver", e);
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
            }
        }).start();
    }
}
