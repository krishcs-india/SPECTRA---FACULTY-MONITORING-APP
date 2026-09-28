export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

import { Capacitor, registerPlugin } from '@capacitor/core';

interface AppFileOpenerPluginType {
  open(options: { filePath: string; mimeType?: string; title?: string }): Promise<{ success: boolean }>;
}

const AppFileOpener = registerPlugin<AppFileOpenerPluginType>('AppFileOpener');

interface PeriodBackgroundSyncPluginType {
  syncCurrentState(options: { departmentId: string; periodCount: number; signature?: string }): Promise<{ success: boolean }>;
  saveUserDetails(options: { userId: string; userName: string; role: string; departmentId?: string }): Promise<{ success: boolean }>;
  clearUserDetails(): Promise<{ success: boolean }>;
  triggerDailyReminderNow(): Promise<{ success: boolean }>;
  checkNow(): Promise<{ success: boolean }>;
  showNotification(options: { title: string; body: string }): Promise<{ success: boolean }>;
  clearNotification(): Promise<{ success: boolean }>;
  getOptimizationStatus(): Promise<{ exactAlarmAllowed: boolean; batteryOptimizationIgnored: boolean; alreadyPrompted?: boolean }>;
  requestExactAlarmPermission(): Promise<{ requested: boolean }>;
  requestBatteryOptimizationExemption(): Promise<{ requested: boolean }>;
}

const PeriodBackgroundSync = registerPlugin<PeriodBackgroundSyncPluginType>('PeriodBackgroundSync');

const isNative = () =>
  typeof window !== 'undefined' && Capacitor.isNativePlatform?.();

/** Fires like WhatsApp/Instagram notifications in the native notification bar */
class NativeNotificationBridge {
  private static readonly DAILY_REMINDER_ID = 42001;
  private channelCreated = false;
  // Module-level permission cache: only triggers the system dialog ONCE per app session.
  // Subsequent calls return the cached result without showing any prompt.
  private permissionGranted: boolean | null = null;

  /**
   * Synchronizes the latest known period count and signature to native SharedPreferences.
   * This allows the native Android background alarm/receiver to detect HOD changes
   * and pop notifications even when the user has not opened the app.
   */
  async syncBackgroundPeriodState(departmentId: string, periodCount: number, signature?: string): Promise<void> {
    if (!isNative()) return;
    try {
      await PeriodBackgroundSync.syncCurrentState({
        departmentId: departmentId || 'CSE',
        periodCount,
        signature: signature || ''
      });
    } catch (err) {
      console.warn('Background period sync state update notice:', err);
    }
  }

  /**
   * Clears any active period update notification from the Android status bar drawer.
   */
  async clearPeriodNotification(): Promise<void> {
    if (!isNative()) return;
    try {
      await PeriodBackgroundSync.clearNotification();
    } catch {}
  }

  /**
   * Prompts user for exact alarm and battery optimization exemptions on Android 12+
   * ONLY ONCE EVER. Never repeats or annoys the user.
   *
   * Source of truth: native Android SharedPreferences (persists across app reinstalls
   * and localStorage wipes). localStorage is only a fast-path cache.
   */
  async checkAndPromptBackgroundPermissions(): Promise<void> {
    if (!isNative()) return;
    try {
      // Fast-path: check localStorage first (avoids the plugin bridge round-trip)
      const PERM_PROMPTED_KEY = 'spectra_bg_perm_prompted_permanent_v1';
      if (localStorage.getItem(PERM_PROMPTED_KEY) === 'true') {
        return;
      }

      // Authoritative check: query native SharedPreferences
      // alreadyPrompted is set by the Java layer and survives localStorage wipes
      const status = await PeriodBackgroundSync.getOptimizationStatus();

      // If native layer confirms already prompted OR both permissions are active, exit
      if (status.alreadyPrompted || (status.exactAlarmAllowed && status.batteryOptimizationIgnored)) {
        // Restore localStorage cache so we don't hit native bridge again next time
        localStorage.setItem(PERM_PROMPTED_KEY, 'true');
        return;
      }

      // Mark prompted BEFORE launching so it NEVER loops, in both native AND localStorage
      localStorage.setItem(PERM_PROMPTED_KEY, 'true');

      // Priority 1: Battery Optimization Exemption (most impactful for background reliability)
      if (!status.batteryOptimizationIgnored) {
        await PeriodBackgroundSync.requestBatteryOptimizationExemption();
        return;
      }

      // Priority 2: Exact Alarms (Android 12+ only)
      if (!status.exactAlarmAllowed) {
        await PeriodBackgroundSync.requestExactAlarmPermission();
      }
    } catch (err) {
      console.warn('Background permissions prompt notice:', err);
    }
  }

  async getOptimizationStatus(): Promise<{ exactAlarmAllowed: boolean; batteryOptimizationIgnored: boolean }> {
    if (!isNative()) return { exactAlarmAllowed: true, batteryOptimizationIgnored: true };
    try {
      return await PeriodBackgroundSync.getOptimizationStatus();
    } catch {
      return { exactAlarmAllowed: true, batteryOptimizationIgnored: true };
    }
  }

  async requestExactAlarmPermission(): Promise<void> {
    if (!isNative()) return;
    try {
      await PeriodBackgroundSync.requestExactAlarmPermission();
    } catch {}
  }

  async requestBatteryOptimizationExemption(): Promise<void> {
    if (!isNative()) return;
    try {
      await PeriodBackgroundSync.requestBatteryOptimizationExemption();
    } catch {}
  }

  private async ensureChannel(): Promise<void> {
    if (this.channelCreated || !isNative()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      try {
        await LocalNotifications.deleteChannel({ id: 'spectra_alerts_v2' });
        await LocalNotifications.deleteChannel({ id: 'spectra_alerts_v3' });
        await LocalNotifications.deleteChannel({ id: 'spectra_alerts_v4' });
      } catch {}
      await LocalNotifications.createChannel({
        id: 'spectra_alerts_v5',
        name: 'SPECTRA Institutional Alerts',
        description: 'Live faculty period schedules, reminders and institutional updates',
        importance: 5,
        visibility: 1,
        lights: true,
        lightColor: '#F43F5E',
        vibration: true
      });
      this.channelCreated = true;
    } catch (e) {
      console.warn('Channel creation notice:', e);
    }
  }

  async requestPermission(forceCheck = false): Promise<boolean> {
    if (!isNative()) return false;
    // Return cached result without re-prompting (prevents repeated system dialogs)
    if (!forceCheck && this.permissionGranted !== null) return this.permissionGranted;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        this.permissionGranted = true;
        return true;
      }
      // Only show the system dialog if permission has never been granted
      if (check.display === 'prompt' || check.display === 'prompt-with-rationale') {
        const res = await LocalNotifications.requestPermissions();
        this.permissionGranted = res.display === 'granted';
      } else {
        // 'denied' — user has explicitly denied; don't ask again
        this.permissionGranted = false;
      }
      return this.permissionGranted;
    } catch (err) {
      console.warn('Native notification permission error:', err);
      this.permissionGranted = false;
      return false;
    }
  }

  async notifyNow(title: string, body: string): Promise<void> {
    // Check cached permission without re-prompting
    if (this.permissionGranted === false) return;
    if (this.permissionGranted === null) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    await this.ensureChannel();
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2000000000,
          title,
          body,
          largeBody: body,
          summaryText: 'SPECTRA',
          channelId: 'spectra_alerts_v5',
          smallIcon: 'ic_spectra_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#F43F5E'
        }]
      });
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }

  /**
   * Dispatches an instant heads-up period notification.
   * Uses a UNIQUE id per change so the 2nd/3rd HOD edit always
   * produces a fresh banner + sound on Vivo/Samsung/Xiaomi
   * (fixed ID 88002 silently replaced the card → looked "ignored").
   * Directly uses native PeriodBackgroundSyncPlugin first for
   * high-priority sound and banner, with LocalNotifications fallback.
   */
  async notifyPeriodUpdate(title: string, body: string): Promise<void> {
    const uniqueId = 88002 + (Math.floor(Date.now() / 1000) % 9000);
    if (isNative()) {
      try {
        await PeriodBackgroundSync.showNotification({ title, body });
      } catch (err) {
        console.warn('Direct native notification dispatch fallback notice:', err);
      }
      // Also schedule via LocalNotifications with unique id so that
      // even if the native fixed-ID card is suppressed, a fresh card appears.
      // Do NOT call requestPermission() here — permission was already handled at startup.
      if (this.permissionGranted === false) return;
      try {
        await this.ensureChannel();
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [{
            id: uniqueId,
            title,
            body,
            largeBody: body,
            summaryText: 'SPECTRA Period Update',
            channelId: 'spectra_alerts_v5',
            smallIcon: 'ic_spectra_notification',
            largeIcon: 'ic_launcher',
            iconColor: '#F43F5E'
          }]
        });
        return;
      } catch (err) {
        console.warn('Period update notification failed:', err);
        return;
      }
    }

    // Web fallback — check without re-prompting
    if (this.permissionGranted === false) return;
    if (this.permissionGranted === null && !(await this.requestPermission())) return;
    await this.ensureChannel();
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: uniqueId,
          title,
          body,
          largeBody: body,
          summaryText: 'SPECTRA Period Update',
          channelId: 'spectra_alerts_v5',
          smallIcon: 'ic_spectra_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#F43F5E'
        }]
      });
    } catch (err) {
      console.warn('Period update notification failed:', err);
    }
  }

  /**
   * Registers a repeating daily morning reminder customized for the user's role.
   * Cancels any previously scheduled reminder from a different role/user so notifications never conflict.
   */
  async ensureDailyReminder(
    role: 'ADMIN' | 'HOD' | 'FACULTY' = 'FACULTY',
    userName = 'Faculty',
    userId = 'unknown',
    departmentId = 'CSE',
    hour = 8,
    minute = 30
  ): Promise<void> {
    if (!isNative()) return;
    try {
      // Do NOT call requestPermission() here — it causes a repeated system dialog.
      // Permission is already handled by the splash screen startup sequence.
      await this.ensureChannel();

      // 1. SAVE USER DETAILS TO NATIVE ANDROID ENGINE
      // Persists user details in native Android SharedPreferences, arms the exact 8:30 AM alarm,
      // and triggers today's reminder immediately if current time is >= 8:30 AM!
      try {
        await PeriodBackgroundSync.saveUserDetails({
          userId: userId || 'unknown',
          userName: userName || 'Faculty',
          role: role || 'FACULTY',
          departmentId: departmentId || 'CSE'
        });
      } catch (nativeErr) {
        console.warn('Native saveUserDetails notice:', nativeErr);
      }

      // Version v5 keys ensure that updates or reinstalls re-arm the schedule properly
      const lastScheduledUser = localStorage.getItem('kalyani_scheduled_reminder_v5_user');
      const lastScheduledRole = localStorage.getItem('kalyani_scheduled_reminder_v5_role');

      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Verify if the alarm is actually registered and active in Android's pending list
      let isActuallyPending = false;
      try {
        const pending = await LocalNotifications.getPending();
        isActuallyPending = pending.notifications?.some(
          (n) => n.id === NativeNotificationBridge.DAILY_REMINDER_ID
        ) || false;
      } catch {}

      // If user and role haven't changed and the alarm is actively registered in Android → skip redundant scheduling
      if (lastScheduledUser === userId && lastScheduledRole === role && isActuallyPending) {
        return;
      }

      // Always cancel previous reminder to prevent old role reminders from leaking
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: NativeNotificationBridge.DAILY_REMINDER_ID }]
        });
      } catch {}

      let title = 'SPECTRA — Ready for a Great Day! ☀️';
      let body = `A wonderful day of teaching awaits, ${userName}! Please take a quick moment to update your period availability or mark Full Day Free to get started.`;

      if (role === 'HOD') {
        title = 'SPECTRA — Good Morning, HOD! ☀️';
        body = `A wonderful day of leadership awaits, ${userName}! Keep track of today’s faculty period availability and department allocations seamlessly in SPECTRA.`;
      } else if (role === 'ADMIN') {
        title = 'SPECTRA — Institutional Overview 🏛️';
        body = `Good morning, ${userName}! Institutional operations, department allocations, and user directories are active and monitored.`;
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: NativeNotificationBridge.DAILY_REMINDER_ID,
          title,
          body,
          largeBody: body,
          summaryText: 'SPECTRA Morning Update',
          channelId: 'spectra_alerts_v5',
          schedule: {
            on: { hour, minute },
            allowWhileIdle: true
          },
          smallIcon: 'ic_spectra_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#F43F5E'
        }]
      });

      localStorage.setItem('kalyani_scheduled_reminder_v5_user', userId);
      localStorage.setItem('kalyani_scheduled_reminder_v5_role', role);
      localStorage.removeItem('kalyani_scheduled_reminder_user');
      localStorage.removeItem('kalyani_scheduled_reminder_role');
    } catch (err) {
      console.warn('Daily reminder scheduling failed:', err);
    }
  }

  /**
   * Immediately triggers the 8:30 AM daily reminder notification now (for verification).
   */
  async triggerDailyReminderNow(): Promise<void> {
    if (!isNative()) return;
    try {
      await PeriodBackgroundSync.triggerDailyReminderNow();
    } catch (err) {
      console.warn('Trigger daily reminder now notice:', err);
    }
  }

  /**
   * Cancels the active daily reminder when logging out
   */
  async cancelDailyReminder(): Promise<void> {
    if (!isNative()) return;
    try {
      try {
        await PeriodBackgroundSync.clearUserDetails();
      } catch {}

      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: [{ id: NativeNotificationBridge.DAILY_REMINDER_ID }]
      });
      // Clear scheduling gate — next login (possibly a different user) will reschedule
      localStorage.removeItem('kalyani_scheduled_reminder_v5_user');
      localStorage.removeItem('kalyani_scheduled_reminder_v5_role');
      localStorage.removeItem('kalyani_scheduled_reminder_user');
      localStorage.removeItem('kalyani_scheduled_reminder_role');
    } catch {}
  }

  /**
   * Dispatches login / daily launch reminder:
   * - If Faculty hasn't updated today's schedule, notifies:
   *   "Welcome back, [Name]! You haven’t updated your schedule today. Kindly confirm your periods or mark yourself free in just a tap."
   * - If HOD logs in, welcomes HOD with department status.
   * - If Admin logs in, welcomes Admin with portal status.
   */
  async notifyLoginOrPendingStatus(
    userId: string,
    userName: string,
    role: 'ADMIN' | 'HOD' | 'FACULTY',
    isSubmittedToday = false,
    isExplicitLogin = false
  ): Promise<void> {
    if (!isNative()) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const key = `kalyani_pending_notified_${userId}_${dateStr}`;
    // If not an explicit login, only show once per day to prevent spam on every app resume
    if (!isExplicitLogin && localStorage.getItem(key)) return;

    if (role === 'HOD') {
      if (isExplicitLogin) {
        await this.notifyNow(
          'SPECTRA — Department Overview ✨',
          `Welcome back, ${userName}! Live faculty availability and today's period assignments are ready for your review.`
        );
      }
    } else if (role === 'ADMIN') {
      if (isExplicitLogin) {
        await this.notifyNow(
          'SPECTRA — Administrator Portal ✨',
          `Welcome back, ${userName}! Institutional directories and system configurations are running smoothly.`
        );
      }
    } else {
      // FACULTY / AHOD
      if (!isSubmittedToday) {
        await this.notifyNow(
          'SPECTRA — Welcome Back ✨',
          `Welcome back, ${userName}! You haven’t updated your schedule today. Kindly confirm your periods or mark yourself free in just a tap.`
        );
        localStorage.setItem(key, '1');
      }
    }
  }

  /**
   * Role-customized nudge upon app launch (max once per day per user)
   */
  async notifyAppLaunchByRole(
    userId: string,
    userName: string,
    role: 'ADMIN' | 'HOD' | 'FACULTY',
    isSubmittedToday = false
  ): Promise<void> {
    return this.notifyLoginOrPendingStatus(userId, userName, role, isSubmittedToday, false);
  }

  /**
   * Instant nudge if today's schedule is still pending (kept for backward compatibility)
   */
  async notifyIfPendingToday(userId: string, userName: string, isSubmitted: boolean): Promise<void> {
    return this.notifyLoginOrPendingStatus(userId, userName, 'FACULTY', isSubmitted, true);
  }

  /**
   * Chrome-style "download complete" system notification for exported files.
   * Tapping it opens the file via the system handler / share sheet.
   */
  async notifyDownloadComplete(fileName: string, fileUri: string): Promise<void> {
    if (!isNative()) return;
    // Use cached permission state — do not re-prompt
    if (this.permissionGranted === false) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const id = 700000000 + Math.floor(Date.now() % 200000000);
      // Remember where the file lives so the tap handler can open it
      localStorage.setItem(`kalyani_dl_uri_${id}`, fileUri);
      await this.ensureChannel();
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: 'Report Ready for You! 📂',
          body: 'Your Excel report has been prepared and downloaded successfully. Tap here whenever you are ready to view it!',
          largeBody: 'Your Excel report has been prepared and downloaded successfully. Tap here whenever you are ready to view it!',
          summaryText: 'SPECTRA Export',
          channelId: 'spectra_alerts_v5',
          smallIcon: 'ic_spectra_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#F43F5E'
        }]
      });
    } catch (err) {
      console.warn('Download notification failed:', err);
    }
  }

  /**
   * Global tap handler: opens the saved file when its "download complete"
   * notification is tapped. Call once at app boot (native only).
   */
  async handleNotificationTaps(): Promise<void> {
    if (!isNative()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      LocalNotifications.removeAllListeners();
      LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
        const id = action.notification.id;
        const uri = localStorage.getItem(`kalyani_dl_uri_${id}`);
        if (!uri) return;
        try {
          await AppFileOpener.open({
            filePath: uri,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            title: 'Open with'
          });
        } catch (openErr) {
          try {
            const { Share } = await import('@capacitor/share');
            await Share.share({
              title: 'Open with',
              url: uri,
              dialogTitle: 'Open with'
            });
          } catch {}
        }
      });
    } catch (err) {
      console.warn('Notification tap listener failed:', err);
    }
  }
}

const nativeBridge = new NativeNotificationBridge();

export interface INotificationProvider {
  name: string;
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  sendNotification(payload: NotificationPayload): Promise<void>;
  scheduleRecurringReminder(intervalMinutes: number, callback: () => void): string | number;
  cancelReminder(reminderId: string | number): void;
}

class WebNotificationProvider implements INotificationProvider {
  name = 'WebNotificationProvider';

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/assets/app-icon-spectra-logo.png',
          badge: '/assets/app-icon-spectra-logo.png',
        });
      } catch (err) {
        console.warn('Web notification dispatch failed:', err);
      }
    }
  }

  scheduleRecurringReminder(intervalMinutes: number, callback: () => void): number {
    const ms = intervalMinutes * 60 * 1000;
    return window.setInterval(callback, ms);
  }

  cancelReminder(reminderId: number): void {
    window.clearInterval(reminderId);
  }
}

class MobileLocalNotificationProvider implements INotificationProvider {
  name = 'MobileLocalNotificationProvider';

  isSupported(): boolean {
    return isNative();
  }

  async requestPermission(): Promise<boolean> {
    return nativeBridge.requestPermission();
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    await nativeBridge.notifyNow(payload.title, payload.body);
  }

  scheduleRecurringReminder(intervalMinutes: number, callback: () => void): number {
    return window.setInterval(callback, intervalMinutes * 60 * 1000);
  }

  cancelReminder(reminderId: number): void {
    window.clearInterval(reminderId);
  }
}

class KalyaniNotificationManager {
  private provider: INotificationProvider;
  private activeReminders: Map<string, number> = new Map();

  constructor() {
    // Select active provider depending on environment
    if (isNative()) {
      this.provider = new MobileLocalNotificationProvider();
    } else {
      this.provider = new WebNotificationProvider();
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (isNative()) {
        return await nativeBridge.requestPermission();
      } else {
        return await this.provider.requestPermission();
      }
    } catch (err) {
      console.warn('Permission request failed:', err);
      return false;
    }
  }

  async init(): Promise<void> {
    // Keep notification cards persistent until user explicitly interacts or swipes
  }

  async notifySchedulePending(facultyName: string, remainingTime?: string): Promise<void> {
    await this.provider.sendNotification({
      title: 'SPECTRA — Almost Done! 🌟',
      body: `Dear, ${facultyName}, you are just a step away. Please finalize your period slots or select Full Day Free to complete your day's schedule.`,
      icon: '/favicon.svg'
    });
  }

  async notifySubmissionSuccess(date: string): Promise<void> {
    await this.provider.sendNotification({
      title: 'SPECTRA — Schedule Confirmed! 🎉',
      body: `All set! Your availability for ${date} has been successfully updated. Wishing you a smooth, engaging, and productive day ahead!`,
      icon: '/favicon.svg'
    });
  }

  startPeriodicReminder(facultyId: string, facultyName: string, intervalMinutes: number = 30): void {
    this.stopPeriodicReminder(facultyId);
    const id = this.provider.scheduleRecurringReminder(intervalMinutes, () => {
      this.notifySchedulePending(facultyName);
    });
    this.activeReminders.set(facultyId, id as number);
  }

  stopPeriodicReminder(facultyId: string): void {
    const existing = this.activeReminders.get(facultyId);
    if (existing !== undefined) {
      this.provider.cancelReminder(existing);
      this.activeReminders.delete(facultyId);
    }
  }

  private lastPeriodNotificationTime = 0;
  private lastPeriodNotificationSig = '';

  /**
   * Deduplicates by CONTENT, not by time alone: the same signature within
   * 10s is suppressed (echo), but a DIFFERENT HOD change always notifies.
   * Fixes shared-throttle bug where 2nd rapid HOD edit was dropped because
   * both notifyPeriodScheduleUpdated (10s) and notifyPeriodUpdated (5s)
   * shared one timestamp.
   */
  private shouldSuppressPeriodAlert(sig: string, windowMs: number): boolean {
    const now = Date.now();
    if (sig && sig === this.lastPeriodNotificationSig && now - this.lastPeriodNotificationTime < windowMs) {
      return true;
    }
    this.lastPeriodNotificationSig = sig;
    this.lastPeriodNotificationTime = now;
    return false;
  }

  async notifyPeriodScheduleUpdated(periodCount: number, deptName?: string): Promise<void> {
    const sig = `count:${deptName || ''}:${periodCount}`;
    if (this.shouldSuppressPeriodAlert(sig, 10000)) return;

    const title = 'SPECTRA — Period Schedule Updated 🔔';
    const deptPrefix = deptName ? `[${deptName}] ` : '';
    const body = `${deptPrefix}The HOD has updated the periods count to ${periodCount} periods. Please review and update your schedule again.`;

    if (isNative()) {
      await nativeBridge.notifyPeriodUpdate(title, body);
    } else {
      await this.provider.sendNotification({
        title,
        body,
        icon: '/assets/app-icon-spectra-logo.png'
      });
    }
  }

  async notifyPeriodUpdated(message?: string, deptName?: string): Promise<void> {
    const sig = `${deptName || ''}:${message || ''}`;
    if (this.shouldSuppressPeriodAlert(sig, 5000)) return;

    const title = 'SPECTRA — Period Schedule Updated 🔔';
    const deptPrefix = deptName ? `[${deptName}] ` : '';
    const body = message || `${deptPrefix}The HOD has updated the periods schedule. Please review and update your schedule again.`;

    if (isNative()) {
      await nativeBridge.notifyPeriodUpdate(title, body);
    } else {
      await this.provider.sendNotification({
        title,
        body,
        icon: '/assets/app-icon-spectra-logo.png'
      });
    }
  }

  syncBackgroundPeriodState(departmentId: string, periodCount: number, signature?: string): void {
    if (isNative()) {
      nativeBridge.syncBackgroundPeriodState(departmentId, periodCount, signature);
    }
  }

  async checkAndPromptBackgroundPermissions(): Promise<void> {
    if (isNative()) {
      await nativeBridge.checkAndPromptBackgroundPermissions();
    }
  }

  async triggerDailyReminderNow(): Promise<void> {
    if (isNative()) {
      await nativeBridge.triggerDailyReminderNow();
    }
  }

  /** Native mobile notification bar support (Android/iOS) */
  get native(): NativeNotificationBridge {
    return nativeBridge;
  }
}

export const notificationService = new KalyaniNotificationManager();
