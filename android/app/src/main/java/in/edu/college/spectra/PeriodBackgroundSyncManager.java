package in.edu.college.spectra;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class PeriodBackgroundSyncManager {
    private static final String TAG = "SpectraPeriodSync";
    public static final String PREFS_NAME = "spectra_period_sync_prefs";
    public static final String KEY_DEPARTMENT_ID = "sync_department_id";
    public static final String KEY_KNOWN_PERIOD_COUNT = "known_period_count";
    public static final String KEY_KNOWN_PERIOD_SIGNATURE = "known_period_signature";
    public static final String KEY_LAST_CHECK_TIME = "last_check_time";
    public static final String KEY_PROMPTED_BATTERY_OPT = "has_prompted_battery_opt_v8";
    public static final String KEY_PROMPTED_EXACT_ALARM = "has_prompted_exact_alarm_v8";
    public static final String KEY_PROMPTED_PERMANENT = "has_prompted_bg_permissions_permanent_v1";
    public static final String KEY_LAST_PROMPT_TIME = "last_permission_prompt_time_v6";
    public static final String KEY_LAST_EXACT_PROMPT_TIME = "last_exact_alarm_prompt_time_v8";
    public static final String KEY_LAST_BATTERY_PROMPT_TIME = "last_battery_prompt_time_v8";
    public static final String KEY_LAST_NOTIFIED_SIG = "last_notified_signature_v6";
    public static final String KEY_NOTIF_COUNTER = "notif_id_counter_v6";

    // Logged-in user details for native 8:30 AM morning reminder
    public static final String KEY_LOGGED_USER_ID = "logged_user_id";
    public static final String KEY_LOGGED_USER_NAME = "logged_user_name";
    public static final String KEY_LOGGED_USER_ROLE = "logged_user_role";
    public static final String KEY_LOGGED_USER_DEPT = "logged_user_dept";
    public static final String KEY_LAST_DAILY_REMINDER_DATE = "last_morning_reminder_date";

    public static final String CHANNEL_ID = "spectra_alerts_v5";
    public static final String ACTION_CHECK_PERIODS = "in.edu.college.spectra.ACTION_CHECK_PERIODS";
    public static final String ACTION_DAILY_REMINDER = "in.edu.college.spectra.ACTION_DAILY_REMINDER";
    public static final int ALARM_REQUEST_CODE = 88001;
    public static final int PERIOD_NOTIFICATION_ID = 88002; // Single fixed ID prevents stacked duplicate notifications
    public static final int DAILY_REMINDER_REQUEST_CODE = 88003;
    public static final int DAILY_REMINDER_NOTIFICATION_ID = 88004;
    public static final long SYNC_INTERVAL_MS = 20 * 1000L; // 20 seconds for rapid synchronization

    private static final String FIRESTORE_URL =
        "https://firestore.googleapis.com/v1/projects/kalyani-e2179/databases/(default)/documents/periods?pageSize=300&key=AIzaSyAORDu_NpbDw1nJ4Jk-u7li988WlVl_u4U";

    /**
     * Updates the local known baseline from the active web session.
     */
    public static void updateBaseline(Context context, String departmentId, int periodCount, String signature) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_DEPARTMENT_ID, departmentId != null ? departmentId.trim().toUpperCase() : "CSE")
            .putInt(KEY_KNOWN_PERIOD_COUNT, periodCount)
            .putString(KEY_KNOWN_PERIOD_SIGNATURE, signature != null ? signature : "")
            .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
            .apply();

        scheduleWorkManager(context);
        scheduleNextCheck(context, SYNC_INTERVAL_MS);
    }

    /**
     * Stores user identity details and immediately arms the 8:30 AM daily reminder.
     * Also checks if today's 8:30 AM morning reminder should be delivered right now
     * (e.g. user logs in or launches app at/after 8:30 AM today).
     */
    public static void saveUserDetails(Context context, String userId, String userName, String role, String departmentId) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_LOGGED_USER_ID, userId != null ? userId.trim() : "")
            .putString(KEY_LOGGED_USER_NAME, userName != null ? userName.trim() : "Faculty")
            .putString(KEY_LOGGED_USER_ROLE, role != null ? role.trim().toUpperCase() : "FACULTY")
            .putString(KEY_LOGGED_USER_DEPT, departmentId != null ? departmentId.trim().toUpperCase() : "CSE")
            .apply();

        Log.d(TAG, "Saved logged user details to native SharedPreferences: uid=" + userId + ", name=" + userName + ", role=" + role);

        // Schedule the 8:30 AM alarm
        scheduleDailyReminder(context);

        // If today is already past 8:30 AM and user hasn't received today's reminder, deliver now!
        checkAndDeliverMorningReminderIfNeeded(context);
    }

    /**
     * Clears user details on logout and cancels the daily reminder alarm.
     */
    public static void clearUserDetails(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(KEY_LOGGED_USER_ID)
            .remove(KEY_LOGGED_USER_NAME)
            .remove(KEY_LOGGED_USER_ROLE)
            .remove(KEY_LOGGED_USER_DEPT)
            .remove(KEY_LAST_DAILY_REMINDER_DATE)
            .apply();

        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                Intent intent = new Intent(context, PeriodSyncReceiver.class);
                intent.setAction(ACTION_DAILY_REMINDER);
                PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    DAILY_REMINDER_REQUEST_CODE,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pi != null) {
                    alarmManager.cancel(pi);
                    pi.cancel();
                }
            }
        } catch (Exception ignored) {}
        Log.d(TAG, "Cleared user details and cancelled 8:30 AM alarm.");
    }

    /**
     * Arms an exact hardware wakeup alarm for 8:30 AM daily.
     * Uses AlarmClockInfo on Android 12-15 to completely bypass Doze mode.
     */
    public static void scheduleDailyReminder(Context context) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String userId = prefs.getString(KEY_LOGGED_USER_ID, null);
            if (userId == null || userId.trim().isEmpty()) {
                Log.d(TAG, "No logged user; skipping 8:30 AM alarm scheduling.");
                return;
            }

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, PeriodSyncReceiver.class);
            intent.setAction(ACTION_DAILY_REMINDER);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                DAILY_REMINDER_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Calendar now = Calendar.getInstance();
            Calendar target = Calendar.getInstance();
            target.set(Calendar.HOUR_OF_DAY, 8);
            target.set(Calendar.MINUTE, 30);
            target.set(Calendar.SECOND, 0);
            target.set(Calendar.MILLISECOND, 0);

            if (now.getTimeInMillis() >= target.getTimeInMillis()) {
                // If it is already past 8:30 AM today, schedule for tomorrow at 8:30 AM
                target.add(Calendar.DAY_OF_YEAR, 1);
            }

            long triggerAtMillis = target.getTimeInMillis();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    try {
                        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(
                            triggerAtMillis, pendingIntent);
                        alarmManager.setAlarmClock(clockInfo, pendingIntent);
                    } catch (Exception e) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                    }
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US);
            Log.d(TAG, "Scheduled 8:30 AM daily reminder for " + userId + " at " + sdf.format(new Date(triggerAtMillis)));
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule 8:30 AM daily reminder", e);
        }
    }

    /**
     * Builds and delivers the daily morning reminder notification customized for the user's role.
     */
    public static void performDailyReminder(Context context) {
        if (context == null) return;
        try {
            ensureNotificationChannel(context);
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String userId = prefs.getString(KEY_LOGGED_USER_ID, null);
            if (userId == null || userId.trim().isEmpty()) {
                Log.d(TAG, "No logged user, skipping daily morning reminder.");
                return;
            }

            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            String lastNotifiedDate = prefs.getString(KEY_LAST_DAILY_REMINDER_DATE, "");
            if (today.equals(lastNotifiedDate)) {
                Log.d(TAG, "Daily morning reminder already delivered today (" + today + ")");
                return;
            }

            String userName = prefs.getString(KEY_LOGGED_USER_NAME, "Faculty");
            String role = prefs.getString(KEY_LOGGED_USER_ROLE, "FACULTY");

            String title;
            String body;

            if ("HOD".equalsIgnoreCase(role)) {
                title = "SPECTRA — Good Morning, HOD! ☀️";
                body = "A wonderful day of leadership awaits, " + userName + "! Live faculty availability and today's period allocations are ready for your review.";
            } else if ("ADMIN".equalsIgnoreCase(role)) {
                title = "SPECTRA — Institutional Overview 🏛️";
                body = "Good morning, " + userName + "! Institutional operations, department allocations, and user directories are active and monitored.";
            } else {
                // FACULTY / AHOD
                title = "SPECTRA — Ready for a Great Day! ☀️";
                body = "A wonderful day of teaching awaits, " + userName + "! Please take a quick moment to update your period availability or mark Full Day Free.";
            }

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                DAILY_REMINDER_REQUEST_CODE,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_spectra_notification)
                .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher))
                .setColor(0xFFF43F5E)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setSubText("SPECTRA Morning Update")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_EVENT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(defaultSoundUri)
                .setVibrate(new long[]{0, 300, 200, 300})
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false)
                .setContentIntent(contentIntent);

            NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.notify(DAILY_REMINDER_NOTIFICATION_ID, builder.build());
                prefs.edit().putString(KEY_LAST_DAILY_REMINDER_DATE, today).apply();
                Log.d(TAG, "Dispatched 8:30 AM daily morning notification for " + userName + " (" + role + ")");
            }

            // Re-arm for tomorrow at 8:30 AM
            scheduleDailyReminder(context);
        } catch (Exception e) {
            Log.e(TAG, "Failed to perform daily morning reminder", e);
        }
    }

    /**
     * Checks if today's morning reminder should be delivered right now upon app launch or login.
     * If the time is >= 8:30 AM today and today's reminder hasn't been shown yet, delivers it.
     */
    public static void checkAndDeliverMorningReminderIfNeeded(Context context) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String userId = prefs.getString(KEY_LOGGED_USER_ID, null);
            if (userId == null || userId.trim().isEmpty()) return;

            Calendar cal = Calendar.getInstance();
            int hour = cal.get(Calendar.HOUR_OF_DAY);
            int minute = cal.get(Calendar.MINUTE);

            boolean isPast830 = (hour > 8) || (hour == 8 && minute >= 30);
            if (!isPast830) return;

            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            String lastNotifiedDate = prefs.getString(KEY_LAST_DAILY_REMINDER_DATE, "");

            if (!today.equals(lastNotifiedDate)) {
                Log.d(TAG, "Delivering today's morning reminder upon app launch/login (time >= 8:30 AM, today=" + today + ")");
                performDailyReminder(context);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking morning reminder delivery upon app launch", e);
        }
    }

    /**
     * Immediately triggers the morning reminder notification for testing / verification.
     */
    public static void forceDailyReminderNow(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_LAST_DAILY_REMINDER_DATE).apply();
        performDailyReminder(context);
    }

    /**
     * Schedules the WorkManager periodic backup and starts the continuous cycle.
     */
    public static void scheduleWorkManager(Context context) {
        if (context == null) return;
        try {
            Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

            PeriodicWorkRequest syncWorkRequest = new PeriodicWorkRequest.Builder(
                PeriodSyncWorker.class,
                15, TimeUnit.MINUTES
            )
            .setConstraints(constraints)
            .build();

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "SpectraPeriodSyncPeriodic",
                ExistingPeriodicWorkPolicy.UPDATE,
                syncWorkRequest
            );

            // Also kick off immediate/continuous WorkManager worker
            PeriodSyncWorker.enqueueImmediate(context);
            Log.d(TAG, "WorkManager background periodic and immediate sync scheduled.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule WorkManager", e);
        }
    }

    /**
     * Schedules an AlarmManager alarm for hardware level heartbeat.
     * Android 15/16/17 (API 35/36/37): setExactAndAllowWhileIdle is batched in
     * Doze — only setAlarmClock fires immediately. Use setAlarmClock when exact
     * alarms are permitted, otherwise fall back gracefully. This fixes 20s polls
     * silently stretching to minutes/hours after the first fire.
     */
    public static void scheduleNextCheck(Context context, long delayMillis) {
        if (context == null) return;
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, PeriodSyncReceiver.class);
            intent.setAction(ACTION_CHECK_PERIODS);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                ALARM_REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerAtMillis = System.currentTimeMillis() + delayMillis;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    // Doze-exempt: fires even in deep Doze on API 31-37.
                    try {
                        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(
                            triggerAtMillis, pendingIntent);
                        alarmManager.setAlarmClock(clockInfo, pendingIntent);
                    } catch (Exception e) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                    }
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
            Log.d(TAG, "Scheduled next background period check alarm in " + (delayMillis / 1000) + "s");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule period check alarm", e);
        }
    }

    /**
     * Triggers an immediate check via WorkManager.
     */
    public static void checkFirestorePeriodsAsync(final Context context) {
        if (context == null) return;
        PeriodSyncWorker.enqueueImmediate(context);
    }

    /**
     * Checks if the app is currently in the foreground (user is actively interacting with the UI).
     */
    public static boolean isAppInForeground(Context context) {
        if (context == null) return false;
        try {
            android.app.ActivityManager am = (android.app.ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) return false;
            List<android.app.ActivityManager.RunningAppProcessInfo> processInfos = am.getRunningAppProcesses();
            if (processInfos == null) return false;
            String packageName = context.getPackageName();
            for (android.app.ActivityManager.RunningAppProcessInfo info : processInfos) {
                if (info.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                        && packageName.equals(info.processName)) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Queries Firestore REST API directly and compares against the known period state.
     * Guaranteed crash-safe with optJSONObject / optString parsing.
     * Fires EXACTLY ONCE when actual changes occur while the app is in the background.
     * Never repeats or stacks notifications, and suppresses alerts when user is already in-app.
     */
    public static void performCheck(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String targetDept = prefs.getString(KEY_DEPARTMENT_ID, "CSE");
        if (targetDept == null) targetDept = "CSE";
        targetDept = targetDept.trim().toUpperCase();

        int knownCount = prefs.getInt(KEY_KNOWN_PERIOD_COUNT, -1);
        String knownSignature = prefs.getString(KEY_KNOWN_PERIOD_SIGNATURE, "");

        HttpURLConnection conn = null;
        try {
            URL url = new URL(FIRESTORE_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(7000);
            conn.setReadTimeout(7000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                Log.w(TAG, "Firestore REST API returned non-200 code: " + responseCode);
                return;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            JSONObject json = new JSONObject(sb.toString());
            if (!json.has("documents")) {
                return;
            }

            JSONArray docs = json.getJSONArray("documents");
            List<String> periodItems = new ArrayList<>();
            int activeCount = 0;

            for (int i = 0; i < docs.length(); i++) {
                JSONObject doc = docs.optJSONObject(i);
                if (doc == null || !doc.has("fields")) continue;
                JSONObject fields = doc.optJSONObject("fields");
                if (fields == null) continue;

                boolean active = true;
                JSONObject activeObj = fields.optJSONObject("active");
                if (activeObj != null && activeObj.has("booleanValue")) {
                    active = activeObj.optBoolean("booleanValue", true);
                }
                if (!active) continue;

                String dept = "";
                JSONObject deptObj = fields.optJSONObject("departmentId");
                if (deptObj != null && deptObj.has("stringValue")) {
                    dept = deptObj.optString("stringValue", "").trim().toUpperCase();
                }

                if (dept.equalsIgnoreCase(targetDept) || targetDept.isEmpty() || targetDept.equalsIgnoreCase("ALL")) {
                    activeCount++;

                    String pId = "";
                    JSONObject idObj = fields.optJSONObject("id");
                    if (idObj != null && idObj.has("stringValue")) {
                        pId = idObj.optString("stringValue", "");
                    }
                    if (pId.isEmpty()) {
                        String docName = doc.optString("name", "");
                        if (docName.contains("/")) {
                            pId = docName.substring(docName.lastIndexOf('/') + 1);
                        } else {
                            pId = "p_" + (i + 1);
                        }
                    }

                    String pName = "";
                    JSONObject nameObj = fields.optJSONObject("name");
                    if (nameObj != null && nameObj.has("stringValue")) {
                        pName = nameObj.optString("stringValue", "");
                    }

                    String shortName = "";
                    JSONObject shortObj = fields.optJSONObject("shortName");
                    if (shortObj != null && shortObj.has("stringValue")) {
                        shortName = shortObj.optString("stringValue", "");
                    }

                    String startTime = "";
                    JSONObject startObj = fields.optJSONObject("startTime");
                    if (startObj != null && startObj.has("stringValue")) {
                        startTime = startObj.optString("stringValue", "");
                    }

                    String endTime = "";
                    JSONObject endObj = fields.optJSONObject("endTime");
                    if (endObj != null && endObj.has("stringValue")) {
                        endTime = endObj.optString("stringValue", "");
                    }

                    String seq = "";
                    JSONObject seqObj = fields.optJSONObject("sequence");
                    if (seqObj != null) {
                        if (seqObj.has("integerValue")) {
                            seq = seqObj.optString("integerValue", "");
                        } else if (seqObj.has("stringValue")) {
                            seq = seqObj.optString("stringValue", "");
                        } else if (seqObj.has("doubleValue")) {
                            seq = String.valueOf((int) seqObj.optDouble("doubleValue", 0));
                        }
                    }
                    if (seq.isEmpty()) {
                        seq = String.valueOf(i + 1);
                    }

                    // Format matches TypeScript EXACTLY: id_name_shortName_startTime_endTime_sequence
                    // (expanded from id_name_sequence so timing/rename edits are detected —
                    // previously 2nd HOD change with same count+name was invisible)
                    periodItems.add(pId + "_" + pName + "_" + shortName + "_" + startTime + "_" + endTime + "_" + seq);
                }
            }

            Collections.sort(periodItems);
            // Matches TypeScript's array.sort().join('|') without any trailing delimiter
            String currentSignature = String.join("|", periodItems);

            Log.d(TAG, "Background check complete for dept " + targetDept + ": found " + activeCount
                    + " active periods (known was " + knownCount + ")");

            if (knownCount != -1) {
                boolean countChanged = (activeCount != knownCount);
                boolean signatureChanged = (!knownSignature.isEmpty() && !knownSignature.equals(currentSignature));

                if (countChanged || signatureChanged) {
                    // Deduplicate identical re-deliveries (e.g. double alarm + worker firing
                    // together) but NEVER suppress a genuinely new signature — every HOD
                    // add/delete/rename/timing edit must alert, not just the first.
                    String lastNotified = prefs.getString(KEY_LAST_NOTIFIED_SIG, "");
                    boolean alreadyNotified = currentSignature.equals(lastNotified);

                    // Always update baseline so this change NEVER fires redundantly…
                    prefs.edit()
                        .putInt(KEY_KNOWN_PERIOD_COUNT, activeCount)
                        .putString(KEY_KNOWN_PERIOD_SIGNATURE, currentSignature)
                        .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
                        .apply();

                    if (!alreadyNotified) {
                        String title = "SPECTRA — Period Schedule Updated 🔔";
                        String body = countChanged
                            ? "The HOD has updated the periods count to " + activeCount + " periods for " + targetDept + ". Please review and update your schedule again."
                            : "The HOD has updated the period schedule for " + targetDept + ". Please review and update your schedule again.";
                        // …and always notify — foreground or background. The old
                        // `if (!appInForeground)` gate advanced the baseline while
                        // suppressing the alert, so any edit made while the app was
                        // open permanently swallowed all future notifications.
                        // JS onSnapshot may also fire in-foreground; the fixed-ID
                        // card is now re-alerted with unique IDs so duplicates
                        // collapse visually instead of losing alerts.
                        showPeriodUpdatedNotification(context, title, body);
                        prefs.edit().putString(KEY_LAST_NOTIFIED_SIG, currentSignature).apply();
                    } else {
                        Log.d(TAG, "Skipping duplicate notify for identical signature.");
                    }
                }
            } else {
                // First initialization — record baseline silently without notifying
                prefs.edit()
                    .putInt(KEY_KNOWN_PERIOD_COUNT, activeCount)
                    .putString(KEY_KNOWN_PERIOD_SIGNATURE, currentSignature)
                    .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
                    .apply();
            }

        } catch (Exception e) {
            Log.e(TAG, "Error checking Firestore periods in background", e);
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /**
     * Builds and dispatches a single high-priority heads-up system notification.
     * Uses a UNIQUE id per change (base 88002 + rotating counter) so the 2nd/3rd
     * HOD edit always produces a fresh banner + sound on Vivo OriginOS, Samsung
     * OneUI and Xiaomi HyperOS — the old fixed ID silently replaced the card.
     */
    public static void showPeriodUpdatedNotification(Context context, String title, String body) {
        try {
            ensureNotificationChannel(context);

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            // Unique requestCode per notification so taps never collide
            int requestCode = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
            PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                requestCode,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_spectra_notification)
                .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher))
                .setColor(0xFFF43F5E)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setSubText("SPECTRA Institutional Alert")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_EVENT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(defaultSoundUri)
                .setVibrate(new long[]{0, 300, 200, 300})
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setOnlyAlertOnce(false)
                .setContentIntent(contentIntent);

            NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                // Rotating ID guarantees every HOD change re-alerts with heads-up
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                int counter = prefs.getInt(KEY_NOTIF_COUNTER, 0);
                int notifId = PERIOD_NOTIFICATION_ID + (counter % 50);
                prefs.edit().putInt(KEY_NOTIF_COUNTER, counter + 1).apply();
                notificationManager.notify(notifId, builder.build());
                Log.d(TAG, "Dispatched native background period notification id=" + notifId);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to display background period notification", e);
        }
    }

    /**
     * Clears all period notifications (base + rotated ids) when the user enters the app.
     */
    public static void clearPeriodNotification(Context context) {
        if (context == null) return;
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(PERIOD_NOTIFICATION_ID);
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                int counter = prefs.getInt(KEY_NOTIF_COUNTER, 0);
                for (int i = 0; i < 50; i++) {
                    try { nm.cancel(PERIOD_NOTIFICATION_ID + i); } catch (Exception ignored) {}
                }
                prefs.edit().putInt(KEY_NOTIF_COUNTER, counter).apply();
                Log.d(TAG, "Cleared period update notifications from drawer.");
            }
        } catch (Exception ignored) {}
    }

    private static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            try {
                nm.deleteNotificationChannel("spectra_period_updates");
                nm.deleteNotificationChannel("spectra_alerts_v2");
                nm.deleteNotificationChannel("spectra_alerts_v3");
                nm.deleteNotificationChannel("spectra_alerts_v4");
            } catch (Exception ignored) {}

            NotificationChannel channel = nm.getNotificationChannel(CHANNEL_ID);
            // Repair path: if the user/OS demoted the channel below HIGH, recreate it
            // so heads-up banners + sound keep working on Android 15/16/17.
            if (channel == null || channel.getImportance() < NotificationManager.IMPORTANCE_HIGH) {
                try { nm.deleteNotificationChannel(CHANNEL_ID); } catch (Exception ignored) {}
                channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SPECTRA Institutional Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Live faculty period schedules, reminders and institutional updates");
                channel.enableLights(true);
                channel.setLightColor(0xFFF43F5E);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 300, 200, 300});
                channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

                Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
                channel.setSound(soundUri, audioAttributes);

                nm.createNotificationChannel(channel);
            }
        }
    }

    public static boolean canScheduleExactAlarms(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            return alarmManager != null && alarmManager.canScheduleExactAlarms();
        }
        return true;
    }

    public static boolean isBatteryOptimizationIgnored(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            return powerManager != null && powerManager.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        return true;
    }

    public static void requestExactAlarmPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_PROMPTED_PERMANENT, false) || prefs.getBoolean(KEY_PROMPTED_EXACT_ALARM, false)) {
                Log.d(TAG, "Exact alarm permission already prompted previously. Skipping.");
                return;
            }
            if (canScheduleExactAlarms(context)) {
                Log.d(TAG, "Exact alarm permission already granted.");
                prefs.edit().putBoolean(KEY_PROMPTED_EXACT_ALARM, true).apply();
                return;
            }
            prefs.edit()
                .putBoolean(KEY_PROMPTED_EXACT_ALARM, true)
                .putBoolean(KEY_PROMPTED_PERMANENT, true)
                .putLong(KEY_LAST_EXACT_PROMPT_TIME, System.currentTimeMillis())
                .apply();

            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                Log.w(TAG, "Failed to open exact alarm settings", e);
            }
        }
    }

    public static void requestBatteryOptimizationExemption(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(KEY_PROMPTED_PERMANENT, false) || prefs.getBoolean(KEY_PROMPTED_BATTERY_OPT, false)) {
                Log.d(TAG, "Battery optimization exemption already prompted previously. Skipping.");
                return;
            }
            // Intelligently check if already exempt (ON) — if so, do not prompt!
            if (isBatteryOptimizationIgnored(context)) {
                Log.d(TAG, "Battery optimization is already ignored (ON). No popup needed.");
                prefs.edit().putBoolean(KEY_PROMPTED_BATTERY_OPT, true).apply();
                return;
            }
            prefs.edit()
                .putBoolean(KEY_PROMPTED_BATTERY_OPT, true)
                .putBoolean(KEY_PROMPTED_PERMANENT, true)
                .putLong(KEY_LAST_BATTERY_PROMPT_TIME, System.currentTimeMillis())
                .apply();

            String manufacturer = Build.MANUFACTURER.toLowerCase();
            boolean launched = false;

            // 1. Always try standard Android battery exemption request first (works on stock Android and Pixel)
            try {
                if (!isBatteryOptimizationIgnored(context)) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + context.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    launched = true;
                    Log.d(TAG, "Battery optimization exemption requested via standard Android dialog.");
                }
            } catch (Exception e) {
                Log.w(TAG, "Standard battery exemption failed, trying OEM fallback: " + e.getMessage());
            }

            // 2. OEM-specific deep-link into battery settings for brands that override standard intent
            if (!launched) {
                try {
                    Intent oemIntent = null;

                    if (manufacturer.contains("samsung")) {
                        // Samsung One UI — open Device Care battery settings
                        oemIntent = new Intent();
                        oemIntent.setComponent(new ComponentName(
                            "com.samsung.android.lool",
                            "com.samsung.android.sm.ui.battery.BatteryActivity"
                        ));
                    } else if (manufacturer.contains("xiaomi") || manufacturer.contains("poco") || manufacturer.contains("redmi")) {
                        // Xiaomi HyperOS / MIUI — open Security Center Autostart Management
                        oemIntent = new Intent();
                        oemIntent.setComponent(new ComponentName(
                            "com.miui.securitycenter",
                            "com.miui.permcenter.autostart.AutoStartManagementActivity"
                        ));
                    } else if (manufacturer.contains("oppo") || manufacturer.contains("realme") || manufacturer.contains("oneplus")) {
                        // OPPO ColorOS / Realme UI / OxygenOS
                        oemIntent = new Intent();
                        oemIntent.setAction("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
                        oemIntent.setData(Uri.parse("package:" + context.getPackageName()));
                    } else if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
                        // Huawei EMUI / Honor MagicUI
                        oemIntent = new Intent();
                        oemIntent.setComponent(new ComponentName(
                            "com.huawei.systemmanager",
                            "com.huawei.systemmanager.startemup.StartupNormalAppListActivity"
                        ));
                    } else if (manufacturer.contains("vivo") || manufacturer.contains("iqoo")) {
                        // Vivo Origin OS / Funtouch OS
                        oemIntent = new Intent();
                        oemIntent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    }

                    if (oemIntent != null) {
                        oemIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(oemIntent);
                        launched = true;
                        Log.d(TAG, "OEM-specific battery settings opened for manufacturer: " + Build.MANUFACTURER);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "OEM battery settings not available: " + e.getMessage());
                }
            }

            // 3. Final universal fallback — opens battery optimization settings list
            if (!launched) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(fallback);
                    Log.d(TAG, "Opened generic battery optimization settings as final fallback.");
                } catch (Exception ignored) {}
            }
        }
    }
}
