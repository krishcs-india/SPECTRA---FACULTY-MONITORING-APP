package in.edu.college.spectra;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PeriodBackgroundSync")
public class PeriodBackgroundSyncPlugin extends Plugin {

    @PluginMethod
    public void syncCurrentState(PluginCall call) {
        String departmentId = call.getString("departmentId", "CSE");
        Integer periodCount = call.getInt("periodCount", -1);
        String signature = call.getString("signature", "");

        PeriodBackgroundSyncManager.updateBaseline(
            getContext().getApplicationContext(),
            departmentId,
            periodCount != null ? periodCount : -1,
            signature
        );

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkNow(PluginCall call) {
        PeriodBackgroundSyncManager.checkFirestorePeriodsAsync(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void showNotification(PluginCall call) {
        String title = call.getString("title", "SPECTRA — Period Schedule Updated \uD83D\uDD14");
        String body = call.getString("body", "The HOD has updated the periods schedule. Please review and update your schedule again.");
        PeriodBackgroundSyncManager.showPeriodUpdatedNotification(getContext().getApplicationContext(), title, body);
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearNotification(PluginCall call) {
        PeriodBackgroundSyncManager.clearPeriodNotification(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void saveUserDetails(PluginCall call) {
        String userId = call.getString("userId", "");
        String userName = call.getString("userName", "Faculty");
        String role = call.getString("role", "FACULTY");
        String departmentId = call.getString("departmentId", "CSE");

        PeriodBackgroundSyncManager.saveUserDetails(
            getContext().getApplicationContext(),
            userId,
            userName,
            role,
            departmentId
        );

        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearUserDetails(PluginCall call) {
        PeriodBackgroundSyncManager.clearUserDetails(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void triggerDailyReminderNow(PluginCall call) {
        PeriodBackgroundSyncManager.forceDailyReminderNow(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getOptimizationStatus(PluginCall call) {
        Context context = getContext().getApplicationContext();
        boolean exactAlarmAllowed = PeriodBackgroundSyncManager.canScheduleExactAlarms(context);
        boolean batteryOptimizationIgnored = PeriodBackgroundSyncManager.isBatteryOptimizationIgnored(context);

        SharedPreferences prefs = context.getSharedPreferences(PeriodBackgroundSyncManager.PREFS_NAME, Context.MODE_PRIVATE);
        boolean alreadyPrompted = prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_PERMANENT, false)
            || prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_BATTERY_OPT, false)
            || prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_EXACT_ALARM, false);

        JSObject ret = new JSObject();
        ret.put("exactAlarmAllowed", exactAlarmAllowed);
        ret.put("batteryOptimizationIgnored", batteryOptimizationIgnored);
        ret.put("alreadyPrompted", alreadyPrompted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            Context context = getContext().getApplicationContext();
            if (PeriodBackgroundSyncManager.canScheduleExactAlarms(context)) {
                call.resolve();
                return;
            }
            android.content.SharedPreferences prefs = context.getSharedPreferences(PeriodBackgroundSyncManager.PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_EXACT_ALARM, false)) {
                call.resolve();
                return;
            }
            prefs.edit()
                .putBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_EXACT_ALARM, true)
                .putBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_PERMANENT, true)
                .apply();

            android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
            
            // Wait for user to return
            startActivityForResult(call, intent, "exactAlarmResult");
        } else {
            call.resolve();
        }
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void exactAlarmResult(PluginCall call, androidx.activity.result.ActivityResult result) {
        call.resolve();
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            Context context = getContext().getApplicationContext();
            if (PeriodBackgroundSyncManager.isBatteryOptimizationIgnored(context)) {
                call.resolve();
                return;
            }
            android.content.SharedPreferences prefs = context.getSharedPreferences(PeriodBackgroundSyncManager.PREFS_NAME, Context.MODE_PRIVATE);
            if (prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_BATTERY_OPT, false)) {
                call.resolve();
                return;
            }
            prefs.edit()
                .putBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_BATTERY_OPT, true)
                .putBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_PERMANENT, true)
                .apply();

            android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
            
            try {
                startActivityForResult(call, intent, "batteryOptResult");
            } catch (Exception e) {
                // Fallback to OEM specific intents if the standard one fails
                String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
                android.content.Intent oemIntent = null;
                
                if (manufacturer.contains("samsung")) {
                    oemIntent = new android.content.Intent();
                    oemIntent.setComponent(new android.content.ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"));
                } else if (manufacturer.contains("xiaomi") || manufacturer.contains("poco") || manufacturer.contains("redmi")) {
                    oemIntent = new android.content.Intent();
                    oemIntent.setComponent(new android.content.ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                } else if (manufacturer.contains("oppo") || manufacturer.contains("realme") || manufacturer.contains("oneplus")) {
                    oemIntent = new android.content.Intent();
                    oemIntent.setAction("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
                    oemIntent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
                } else if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
                    oemIntent = new android.content.Intent();
                    oemIntent.setComponent(new android.content.ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startemup.StartupNormalAppListActivity"));
                } else if (manufacturer.contains("vivo") || manufacturer.contains("iqoo")) {
                    oemIntent = new android.content.Intent();
                    oemIntent.setAction(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                }

                if (oemIntent != null) {
                    try {
                        startActivityForResult(call, oemIntent, "batteryOptResult");
                        return;
                    } catch (Exception ignored) {}
                }

                // Final universal fallback
                android.content.Intent fallback = new android.content.Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                try {
                    startActivityForResult(call, fallback, "batteryOptResult");
                } catch (Exception ignored2) {
                    call.resolve();
                }
            }
        } else {
            call.resolve();
        }
    }

    @com.getcapacitor.annotation.ActivityCallback
    private void batteryOptResult(PluginCall call, androidx.activity.result.ActivityResult result) {
        call.resolve();
    }
}
