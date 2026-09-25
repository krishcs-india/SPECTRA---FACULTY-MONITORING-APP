package in.edu.college.spectra;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "SpectraBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || "android.intent.action.MY_PACKAGE_REPLACED".equals(action)) {
            Log.d(TAG, "Phone rebooted or app updated. Automatically resuming background period sync.");
            if (context != null) {
                Context appContext = context.getApplicationContext();
                PeriodBackgroundSyncManager.scheduleWorkManager(appContext);
                PeriodSyncWorker.enqueueImmediate(appContext);
                PeriodBackgroundSyncManager.scheduleNextCheck(appContext, 15000L);
            }
        }
    }
}
