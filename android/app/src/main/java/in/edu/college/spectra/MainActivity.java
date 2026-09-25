package in.edu.college.spectra;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppFileOpenerPlugin.class);
        registerPlugin(PeriodBackgroundSyncPlugin.class);
        super.onCreate(savedInstanceState);

        // Clear any delivered period update notifications since user is now in the app
        PeriodBackgroundSyncManager.clearPeriodNotification(getApplicationContext());

        // Ensure background period sync monitoring is armed via both WorkManager and AlarmManager
        PeriodBackgroundSyncManager.scheduleWorkManager(getApplicationContext());
        PeriodBackgroundSyncManager.scheduleNextCheck(getApplicationContext(), 10000L);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Dismiss stale notification when returning to the app
        PeriodBackgroundSyncManager.clearPeriodNotification(getApplicationContext());
    }
}
