export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

import { Capacitor } from '@capacitor/core';

const isNative = () =>
  typeof window !== 'undefined' && Capacitor.isNativePlatform?.();

/** Fires like WhatsApp/Instagram notifications in the native notification bar */
class NativeNotificationBridge {
  private static readonly DAILY_REMINDER_ID = 42001;

  async requestPermission(): Promise<boolean> {
    if (!isNative()) return false;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted';
    } catch {
      return false;
    }
  }

  async notifyNow(title: string, body: string): Promise<void> {
    if (!(await this.requestPermission())) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2000000000,
          title,
          body,
          smallIcon: 'ic_launcher',
          iconColor: '#D4AF37'
        }]
      });
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }

  /**
   * Registers a repeating daily reminder (idempotent — once per device per day)
   */
  async ensureDailyReminder(hour = 8, minute = 30): Promise<void> {
    if (!isNative()) return;
    try {
      const key = `kalyani_daily_reminder_${new Date().toISOString().slice(0, 10)}`;
      if (localStorage.getItem(key)) return;
      if (!(await this.requestPermission())) return;

      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{
          id: NativeNotificationBridge.DAILY_REMINDER_ID,
          title: 'Kalyani — Ready for a Great Day! ☀️',
          body: 'A wonderful day of teaching awaits. Please take a quick moment to update your period availability or mark Full Day Free to get started.',
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          smallIcon: 'ic_launcher',
          iconColor: '#D4AF37'
        }]
      });
      localStorage.setItem(key, '1');
    } catch (err) {
      console.warn('Daily reminder scheduling failed:', err);
    }
  }

  /**
   * Instant nudge if today's schedule is still pending (max once per day)
   */
  async notifyIfPendingToday(userId: string, userName: string, isSubmitted: boolean): Promise<void> {
    if (!isNative() || isSubmitted) return;
    const key = `kalyani_pending_notified_${userId}_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    await this.notifyNow(
      'Kalyani — Quick Schedule Check ✨',
      `Welcome back, ${userName}! Let’s get today’s schedule lined up. Please confirm your periods or mark yourself free in just a tap.`
    );
    localStorage.setItem(key, '1');
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
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: 'Report Ready for You! 📂',
          body: 'Your Excel report has been prepared and downloaded successfully. Tap here whenever you are ready to view it!',
          smallIcon: 'ic_launcher',
          iconColor: '#D4AF37'
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
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: 'Open downloaded file',
            url: uri,
            dialogTitle: 'Open / Save File'
          });
        } catch {}
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
          icon: payload.icon || '/favicon.svg',
          badge: '/favicon.svg',
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
    // Check if Capacitor LocalNotifications plugin is injected on window
    return typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform());
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
    const mobile = new MobileLocalNotificationProvider();
    if (mobile.isSupported()) {
      this.provider = mobile;
    } else {
      this.provider = new WebNotificationProvider();
    }
  }

  async init(): Promise<void> {
    if (this.provider.isSupported()) {
      await this.provider.requestPermission();
    }
  }

  async notifySchedulePending(facultyName: string, remainingTime?: string): Promise<void> {
    await this.provider.sendNotification({
      title: 'Kalyani — Almost Done! 🌟',
      body: `Dear, ${facultyName}, you are just a step away. Please finalize your period slots or select Full Day Free to complete your day's schedule.`,
      icon: '/favicon.svg'
    });
  }

  async notifySubmissionSuccess(date: string): Promise<void> {
    await this.provider.sendNotification({
      title: 'Kalyani — Schedule Confirmed! 🎉',
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

  /** Native mobile notification bar support (Android/iOS) */
  get native(): NativeNotificationBridge {
    return nativeBridge;
  }
}

export const notificationService = new KalyaniNotificationManager();
