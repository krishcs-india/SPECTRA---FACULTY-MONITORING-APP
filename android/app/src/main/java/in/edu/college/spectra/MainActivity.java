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

        // Explicitly request POST_NOTIFICATIONS permission at Activity level on Android 13+ (API 33-36)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

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
            PeriodSyncWorker.enqueueImmediate(getApplicationContext());
        } catch (Exception ignored) {}
    }
}

