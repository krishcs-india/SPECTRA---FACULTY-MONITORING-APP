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
    public void clearNotification(PluginCall call) {
        PeriodBackgroundSyncManager.clearPeriodNotification(getContext().getApplicationContext());
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
        boolean alreadyPrompted = prefs.getBoolean(PeriodBackgroundSyncManager.KEY_PROMPTED_BATTERY_OPT, false);

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
