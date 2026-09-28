package in.edu.college.spectra;

import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppFileOpenerPlugin.class);
        registerPlugin(PeriodBackgroundSyncPlugin.class);
        super.onCreate(savedInstanceState);

        // Ensure background period sync monitoring is armed via both WorkManager and AlarmManager
        PeriodBackgroundSyncManager.scheduleWorkManager(getApplicationContext());
        PeriodBackgroundSyncManager.scheduleNextCheck(getApplicationContext(), 5000L);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Android 15/16/17 can revoke SCHEDULE_EXACT_ALARM at runtime — re-arm the
        // Doze-exempt heartbeat every time the app returns to foreground so the
        // 2nd+ HOD change is never stuck on a dead inexact alarm.
        try {
            PeriodBackgroundSyncManager.scheduleNextCheck(getApplicationContext(), 5000L);
            PeriodBackgroundSyncManager.scheduleDailyReminder(getApplicationContext());
            PeriodSyncWorker.enqueueImmediate(getApplicationContext());
        } catch (Exception ignored) {}

        // If the user opens or resumes the app at or after 8:30 AM and today's
        // morning reminder hasn't been delivered yet (e.g. alarm was batched by Doze),
        // fire it immediately so no reminder is ever silently missed.
        try {
            PeriodBackgroundSyncManager.checkAndDeliverMorningReminderIfNeeded(getApplicationContext());
        } catch (Exception ignored) {}
    }
}

