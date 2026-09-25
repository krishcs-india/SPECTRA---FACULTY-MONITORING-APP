package in.edu.college.spectra;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

/**
 * PeriodSyncWorker executes background checks against the Firestore REST API
 * using Android's JobScheduler / WorkManager infrastructure.
 *
 * Crucial for Android 14, 15, 16 & 17:
 * Raw threads inside BroadcastReceivers are suspended by the Linux kernel Cached Apps Freezer.
 * WorkManager jobs executed with NetworkType.CONNECTED are fully authorized for background network access
 * and are NOT frozen while running.
 */
public class PeriodSyncWorker extends Worker {
    private static final String TAG = "SpectraPeriodWorker";
    public static final String UNIQUE_WORK_NAME = "SpectraPeriodSyncContinuous";
    public static final long SYNC_DELAY_SECONDS = 20L;

    public PeriodSyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d(TAG, "PeriodSyncWorker executed under system JobService with active network authorization!");
        Context context = getApplicationContext();

        try {
            // Check Firestore for HOD period additions, renames, deletions, or count changes
            PeriodBackgroundSyncManager.performCheck(context);
        } catch (Exception e) {
            Log.e(TAG, "Error during PeriodSyncWorker performCheck", e);
        } finally {
            try {
                // Continuous self-chaining: schedule the next WorkManager check in 60s
                scheduleNextRun(context, SYNC_DELAY_SECONDS);

                // In parallel, reinforce the AlarmManager hardware wakeup heartbeat in 60s
                PeriodBackgroundSyncManager.scheduleNextCheck(context, SYNC_DELAY_SECONDS * 1000L);
            } catch (Exception ex) {
                Log.e(TAG, "Error scheduling subsequent check from worker", ex);
            }
        }

        return Result.success();
    }

    /**
     * Enqueues an immediate WorkManager job to check Firestore right now.
     */
    public static void enqueueImmediate(Context context) {
        if (context == null) return;
        try {
            Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

            OneTimeWorkRequest work = new OneTimeWorkRequest.Builder(PeriodSyncWorker.class)
                .setConstraints(constraints)
                .build();

            WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                work
            );
            Log.d(TAG, "Immediate WorkManager sync enqueued successfully.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to enqueue immediate WorkManager sync", e);
        }
    }

    /**
     * Enqueues the next WorkManager check with an initial delay.
     * Survives app closure and recent apps dismissal because it is held by system_server JobScheduler.
     */
    public static void scheduleNextRun(Context context, long delaySeconds) {
        if (context == null) return;
        try {
            Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

            OneTimeWorkRequest nextWork = new OneTimeWorkRequest.Builder(PeriodSyncWorker.class)
                .setConstraints(constraints)
                .setInitialDelay(delaySeconds, TimeUnit.SECONDS)
                .build();

            WorkManager.getInstance(context).enqueueUniqueWork(
                UNIQUE_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                nextWork
            );
            Log.d(TAG, "Scheduled next WorkManager sync in " + delaySeconds + "s");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule next WorkManager sync", e);
        }
    }
}
