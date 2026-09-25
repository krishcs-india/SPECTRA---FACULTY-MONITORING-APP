package in.edu.college.spectra;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class PeriodSyncReceiver extends BroadcastReceiver {
    private static final String TAG = "SpectraPeriodReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "PeriodSyncReceiver triggered by AlarmManager while app is closed/idle!");
        if (context != null) {
            PeriodBackgroundSyncManager.checkFirestorePeriodsAsync(context.getApplicationContext());
        }
    }
}
