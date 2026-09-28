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
        if (action == null) return;
        // Cover stock reboot + OEM quick-boot + direct-boot (locked) + app update +
        // clock changes: without these, alarms die on reboot/timezone change on
        // Android 15/16/17 and notifications never resume after the first install.
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "android.intent.action.LOCKED_BOOT_COMPLETED".equals(action)
                || "android.intent.action.MY_PACKAGE_REPLACED".equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_USER_PRESENT.equals(action)) {
            Log.d(TAG, "Phone rebooted or app updated. Automatically resuming background period sync.");
            if (context != null) {
                Context appContext = context.getApplicationContext();
                PeriodBackgroundSyncManager.scheduleWorkManager(appContext);
                PeriodSyncWorker.enqueueImmediate(appContext);
                PeriodBackgroundSyncManager.scheduleNextCheck(appContext, 15000L);
                PeriodBackgroundSyncManager.scheduleDailyReminder(appContext);
                PeriodBackgroundSyncManager.checkAndDeliverMorningReminderIfNeeded(appContext);
            }
        }
    }
}
