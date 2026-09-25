package in.edu.college.spectra;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class PeriodSyncWorker extends Worker {
    private static final String TAG = "SpectraPeriodWorker";

    public PeriodSyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "PeriodSyncWorker executed by WorkManager with granted network access!");
        try {
            PeriodBackgroundSyncManager.performCheck(getApplicationContext());
            return Result.success();
        } catch (Exception e) {
            Log.e(TAG, "Error in PeriodSyncWorker", e);
            return Result.retry();
        }
    }
}
