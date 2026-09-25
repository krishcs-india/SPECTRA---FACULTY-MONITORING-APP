package in.edu.college.spectra;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * PeriodSyncReceiver handles AlarmManager triggers while the SPECTRA app is closed or backgrounded.
 *
 * Rather than spawning a raw background thread (which Android 14, 15, 16's Linux Cached Apps Freezer
 * puts to sleep and cuts off network traffic), this receiver delegates the network check
 * directly to WorkManager (JobScheduler), which is fully authorized by the OS for background network I/O.
 */
public class PeriodSyncReceiver extends BroadcastReceiver {
    private static final String TAG = "SpectraPeriodReceiver";

    @Override
    public void onReceive(final Context context, Intent intent) {
        Log.d(TAG, "PeriodSyncReceiver alarm triggered. Delegating check to WorkManager JobScheduler.");
        if (context == null) return;

        Context appContext = context.getApplicationContext();

        // 1. Delegate network check to WorkManager so it runs with guaranteed system network clearance
        PeriodSyncWorker.enqueueImmediate(appContext);

        // 2. Also ensure AlarmManager is scheduled for the next 60s as a secondary hardware heartbeat
        PeriodBackgroundSyncManager.scheduleNextCheck(appContext, PeriodBackgroundSyncManager.SYNC_INTERVAL_MS);
    }
}
