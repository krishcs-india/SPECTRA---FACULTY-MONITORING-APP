package in.edu.college.spectra;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class PeriodBackgroundSyncManager {
    private static final String TAG = "SpectraPeriodSync";
    public static final String PREFS_NAME = "spectra_period_sync_prefs";
    public static final String KEY_DEPARTMENT_ID = "sync_department_id";
    public static final String KEY_KNOWN_PERIOD_COUNT = "known_period_count";
    public static final String KEY_KNOWN_PERIOD_SIGNATURE = "known_period_signature";
    public static final String KEY_LAST_CHECK_TIME = "last_check_time";

    public static final String CHANNEL_ID = "spectra_alerts_v3";
    public static final String ACTION_CHECK_PERIODS = "in.edu.college.spectra.ACTION_CHECK_PERIODS";
    public static final int ALARM_REQUEST_CODE = 88001;
    public static final long SYNC_INTERVAL_MS = 90 * 1000L; // 90 seconds (1.5 minutes)

    private static final String FIRESTORE_URL =
        "https://firestore.googleapis.com/v1/projects/kalyani-e2179/databases/(default)/documents/periods?key=AIzaSyAORDu_NpbDw1nJ4Jk-u7li988WlVl_u4U";

    public static void updateBaseline(Context context, String departmentId, int periodCount, String signature) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_DEPARTMENT_ID, departmentId != null ? departmentId.trim().toUpperCase() : "CSE")
            .putInt(KEY_KNOWN_PERIOD_COUNT, periodCount)
            .putString(KEY_KNOWN_PERIOD_SIGNATURE, signature != null ? signature : "")
            .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
            .apply();

        scheduleNextCheck(context, SYNC_INTERVAL_MS);
        scheduleWorkManager(context);
    }

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
                "SpectraPeriodSyncWork",
                ExistingPeriodicWorkPolicy.KEEP,
                syncWorkRequest
            );
            Log.d(TAG, "WorkManager periodic sync scheduled.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule WorkManager", e);
        }
    }

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

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                    } else {
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                    }
                } else {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
            Log.d(TAG, "Scheduled next background period check in " + (delayMillis / 1000) + "s");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule period check alarm", e);
        }
    }

    public static void checkFirestorePeriodsAsync(final Context context) {
        if (context == null) return;
        new Thread(new Runnable() {
            @Override
            public void run() {
                performCheck(context);
                scheduleNextCheck(context, SYNC_INTERVAL_MS);
            }
        }).start();
    }

    public static void performCheck(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String targetDept = prefs.getString(KEY_DEPARTMENT_ID, "CSE");
        int knownCount = prefs.getInt(KEY_KNOWN_PERIOD_COUNT, -1);
        String knownSignature = prefs.getString(KEY_KNOWN_PERIOD_SIGNATURE, "");

        HttpURLConnection conn = null;
        try {
            URL url = new URL(FIRESTORE_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                Log.w(TAG, "Firestore REST API returned response code: " + responseCode);
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
                JSONObject doc = docs.getJSONObject(i);
                if (!doc.has("fields")) continue;
                JSONObject fields = doc.getJSONObject("fields");

                boolean active = true;
                if (fields.has("active") && fields.getJSONObject("active").has("booleanValue")) {
                    active = fields.getJSONObject("active").getBoolean("booleanValue");
                }
                if (!active) continue;

                String dept = "";
                if (fields.has("departmentId") && fields.getJSONObject("departmentId").has("stringValue")) {
                    dept = fields.getJSONObject("departmentId").getString("stringValue").trim().toUpperCase();
                }

                if (dept.equalsIgnoreCase(targetDept) || targetDept.isEmpty()) {
                    activeCount++;
                    String pId = fields.has("id") && fields.getJSONObject("id").has("stringValue")
                        ? fields.getJSONObject("id").getString("stringValue") : ("p_" + i);
                    String pName = fields.has("name") && fields.getJSONObject("name").has("stringValue")
                        ? fields.getJSONObject("name").getString("stringValue") : "";
                    String seq = fields.has("sequence") && fields.getJSONObject("sequence").has("integerValue")
                        ? fields.getJSONObject("sequence").getString("integerValue") : String.valueOf(i);
                    periodItems.add(pId + "_" + seq + "_" + pName);
                }
            }

            Collections.sort(periodItems);
            StringBuilder sigBuilder = new StringBuilder();
            for (String item : periodItems) {
                sigBuilder.append(item).append("|");
            }
            String currentSignature = sigBuilder.toString();

            Log.d(TAG, "Background check complete for dept " + targetDept + ": found " + activeCount + " periods (known was " + knownCount + ")");

            if (knownCount != -1 && knownCount != 0) {
                if (activeCount != knownCount) {
                    showPeriodUpdatedNotification(
                        context,
                        "SPECTRA — Period Schedule Updated 🔔",
                        "The HOD has updated the periods count to " + activeCount + " periods. Please review and update your schedule again."
                    );
                    prefs.edit()
                        .putInt(KEY_KNOWN_PERIOD_COUNT, activeCount)
                        .putString(KEY_KNOWN_PERIOD_SIGNATURE, currentSignature)
                        .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
                        .apply();
                } else if (!knownSignature.isEmpty() && !knownSignature.equals(currentSignature)) {
                    showPeriodUpdatedNotification(
                        context,
                        "SPECTRA — Period Schedule Updated 🔔",
                        "The HOD has updated the period schedule for " + targetDept + ". Please review and update your schedule again."
                    );
                    prefs.edit()
                        .putString(KEY_KNOWN_PERIOD_SIGNATURE, currentSignature)
                        .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
                        .apply();
                }
            } else {
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

    public static void showPeriodUpdatedNotification(Context context, String title, String body) {
        try {
            ensureNotificationChannel(context);

            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_spectra_notification)
                .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher))
                .setColor(0xFFF43F5E)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setSubText("SPECTRA")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

            NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                int notifId = (int) (System.currentTimeMillis() % 2000000000L);
                notificationManager.notify(notifId, builder.build());
                Log.d(TAG, "Dispatched native background notification successfully!");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to display background period notification", e);
        }
    }

    private static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel channel = nm.getNotificationChannel(CHANNEL_ID);
            if (channel == null) {
                channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SPECTRA Institutional Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Live faculty period schedules, reminders and institutional updates");
                channel.enableLights(true);
                channel.setLightColor(0xFFF43F5E);
                channel.enableVibration(true);
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
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                } catch (Exception ignored) {}
            }
        }
    }
}
