package in.edu.college.spectra;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * DailyReminderWorker — WorkManager-based fallback for the 8:30 AM daily morning reminder.
 *
 * This worker fires when the AlarmManager-based alarm cannot be scheduled exactly
 * (e.g. Android 14+ revoked SCHEDULE_EXACT_ALARM without telling the user).
 * WorkManager is guaranteed to execute by the OS JobScheduler infrastructure
 * and survives Doze mode, app death, and battery optimization — unlike raw alarms.
 *
 * It delivers today's morning reminder and immediately re-arms itself for
 * tomorrow's 8:30 AM to continue the daily cycle.
 */
public class DailyReminderWorker extends Worker {
    private static final String TAG = "SpectraDailyWorker";
    public static final String UNIQUE_WORK_NAME = "SpectraDailyReminder8_30";

    public DailyReminderWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        Log.d(TAG, "DailyReminderWorker fired at " +
            new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date()));

        try {
            // Deliver the morning reminder if not already sent today
            PeriodBackgroundSyncManager.performDailyReminder(context);
        } catch (Exception e) {
            Log.e(TAG, "Error delivering daily morning reminder from WorkManager", e);
        }

        // Re-arm for tomorrow's 8:30 AM immediately (before returning so the cycle
        // continues even if the AlarmManager alarm is permanently revoked)
        try {
            PeriodBackgroundSyncManager.scheduleDailyReminder(context);
        } catch (Exception e) {
            Log.e(TAG, "Error re-arming daily reminder from DailyReminderWorker", e);
        }

        return Result.success();
    }
}
