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
        PeriodBackgroundSyncManager.requestExactAlarmPermission(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("requested", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        PeriodBackgroundSyncManager.requestBatteryOptimizationExemption(getContext().getApplicationContext());
        JSObject ret = new JSObject();
        ret.put("requested", true);
        call.resolve(ret);
    }
}
