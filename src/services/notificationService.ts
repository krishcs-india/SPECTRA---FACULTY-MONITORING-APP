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

const isNative = () =>
  typeof window !== 'undefined' && Capacitor.isNativePlatform?.();

/** Fires like WhatsApp/Instagram notifications in the native notification bar */
class NativeNotificationBridge {
  private static readonly DAILY_REMINDER_ID = 42001;
  private channelCreated = false;

  private async ensureChannel(): Promise<void> {
    if (this.channelCreated || !isNative()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      try {
        await LocalNotifications.deleteChannel({ id: 'spectra_alerts_v2' });
      } catch {}
      await LocalNotifications.createChannel({
        id: 'spectra_alerts_v3',
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

  async requestPermission(): Promise<boolean> {
    if (!isNative()) return false;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') return true;
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted';
    } catch (err) {
      console.warn('Native notification permission error:', err);
      return false;
    }
  }

  async notifyNow(title: string, body: string): Promise<void> {
    if (!(await this.requestPermission())) return;
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
          channelId: 'spectra_alerts_v3',
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
   * Registers a repeating daily morning reminder customized for the user's role.
   * Cancels any previously scheduled reminder from a different role/user so notifications never conflict.
   */
  async ensureDailyReminder(
    role: 'ADMIN' | 'HOD' | 'FACULTY' = 'FACULTY',
    userName = 'Faculty',
    userId = 'unknown',
    hour = 8,
    minute = 30
  ): Promise<void> {
    if (!isNative()) return;
    try {
      const todayDate = new Date().toISOString().slice(0, 10);
      const lastScheduledUser = localStorage.getItem('kalyani_scheduled_reminder_user');
      const lastScheduledRole = localStorage.getItem('kalyani_scheduled_reminder_role');
      const lastScheduledDate = localStorage.getItem('kalyani_scheduled_reminder_date');

      // If already scheduled for this exact user and role today, do not reschedule redundantly
      if (
        lastScheduledUser === userId &&
        lastScheduledRole === role &&
        lastScheduledDate === todayDate
      ) {
        return;
      }

      if (!(await this.requestPermission())) return;

      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Always cancel previous reminder to prevent old role reminders from leaking
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: NativeNotificationBridge.DAILY_REMINDER_ID }]
        });
      } catch {}

      let title = 'SPECTRA — Ready for a Great Day! ☀️';
      let body = 'A wonderful day of teaching awaits. Please take a quick moment to update your period availability or mark Full Day Free to get started.';

      if (role === 'HOD') {
        title = 'SPECTRA — Good Morning, HOD! ☀️';
        body = 'A wonderful day of leadership awaits. Keep track of today’s faculty period availability and department allocations seamlessly in SPECTRA.';
      } else if (role === 'ADMIN') {
        title = 'SPECTRA — Institutional Overview 🏛️';
        body = 'Good morning, Administrator! Institutional operations, department allocations, and user directories are active and monitored.';
      }

      await this.ensureChannel();
      await LocalNotifications.schedule({
        notifications: [{
          id: NativeNotificationBridge.DAILY_REMINDER_ID,
          title,
          body,
          largeBody: body,
          summaryText: 'SPECTRA Morning Update',
          channelId: 'spectra_alerts_v3',
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          smallIcon: 'ic_spectra_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#F43F5E'
        }]
      });

      localStorage.setItem('kalyani_scheduled_reminder_user', userId);
      localStorage.setItem('kalyani_scheduled_reminder_role', role);
      localStorage.setItem('kalyani_scheduled_reminder_date', todayDate);
    } catch (err) {
      console.warn('Daily reminder scheduling failed:', err);
    }
  }

  /**
   * Cancels the active daily reminder when logging out
   */
  async cancelDailyReminder(): Promise<void> {
    if (!isNative()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: [{ id: NativeNotificationBridge.DAILY_REMINDER_ID }]
      });
      localStorage.removeItem('kalyani_scheduled_reminder_user');
      localStorage.removeItem('kalyani_scheduled_reminder_role');
      localStorage.removeItem('kalyani_scheduled_reminder_date');
    } catch {}
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
    if (!isNative()) return;
    const key = `kalyani_launch_notified_${userId}_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;

    if (role === 'HOD') {
      await this.notifyNow(
        'SPECTRA — Department Overview ✨',
        `Welcome back, ${userName}! Live faculty availability and today's period assignments are ready for your review.`
      );
      localStorage.setItem(key, '1');
    } else if (role === 'ADMIN') {
      await this.notifyNow(
        'SPECTRA — Administrator Portal ✨',
        `Welcome back, ${userName}! Institutional directories and system configurations are running smoothly.`
      );
      localStorage.setItem(key, '1');
    } else {
      // FACULTY / AHOD - only notify if today's schedule is pending
      if (!isSubmittedToday) {
        await this.notifyNow(
          'SPECTRA — Quick Schedule Check ✨',
          `Welcome back, ${userName}! Let’s get today’s schedule lined up. Please confirm your periods or mark yourself free in just a tap.`
        );
        localStorage.setItem(key, '1');
      }
    }
  }

  /**
   * Instant nudge if today's schedule is still pending (kept for backward compatibility)
   */
  async notifyIfPendingToday(userId: string, userName: string, isSubmitted: boolean): Promise<void> {
    return this.notifyAppLaunchByRole(userId, userName, 'FACULTY', isSubmitted);
  }

  /**
   * Chrome-style "download complete" system notification for exported files.
   * Tapping it opens the file via the system handler / share sheet.
   */
  async notifyDownloadComplete(fileName: string, fileUri: string): Promise<void> {
    if (!isNative()) return;
    if (!(await this.requestPermission())) return;
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
          channelId: 'spectra_alerts_v3',
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
    // Setup
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

  async notifyPeriodScheduleUpdated(periodCount: number, deptName?: string): Promise<void> {
    const now = Date.now();
    if (now - this.lastPeriodNotificationTime < 3000) return;
    this.lastPeriodNotificationTime = now;

    const title = 'SPECTRA — Period Schedule Updated 🔔';
    const deptPrefix = deptName ? `[${deptName}] ` : '';
    const body = `${deptPrefix}The HOD has updated the periods count to ${periodCount} periods. Please review and update your schedule again.`;

    if (isNative()) {
      await nativeBridge.notifyNow(title, body);
    } else {
      await this.provider.sendNotification({
        title,
        body,
        icon: '/assets/app-icon-spectra-logo.png'
      });
    }
  }

  async notifyPeriodUpdated(message?: string, deptName?: string): Promise<void> {
    const now = Date.now();
    if (now - this.lastPeriodNotificationTime < 3000) return;
    this.lastPeriodNotificationTime = now;

    const title = 'SPECTRA — Period Schedule Updated 🔔';
    const deptPrefix = deptName ? `[${deptName}] ` : '';
    const body = message || `${deptPrefix}The HOD has updated the periods schedule. Please review and update your schedule again.`;

    if (isNative()) {
      await nativeBridge.notifyNow(title, body);
    } else {
      await this.provider.sendNotification({
        title,
        body,
        icon: '/assets/app-icon-spectra-logo.png'
      });
    }
  }

  /** Native mobile notification bar support (Android/iOS) */
  get native(): NativeNotificationBridge {
    return nativeBridge;
  }
}

export const notificationService = new KalyaniNotificationManager();
