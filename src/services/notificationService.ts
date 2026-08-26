export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

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
    // Will be linked to @capacitor/local-notifications in Phase 2
    return true;
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    console.log('[Mobile Provider] Notification dispatched:', payload);
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
      title: 'Kalyani — Daily Period Schedule Pending',
      body: `Namaste ${facultyName}, please submit your period availability or mark Full Day Free for today.`,
      icon: '/favicon.svg'
    });
  }

  async notifySubmissionSuccess(date: string): Promise<void> {
    await this.provider.sendNotification({
      title: 'Kalyani — Schedule Submitted Successfully',
      body: `Your period availability for ${date} has been synchronized in real-time.`,
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
}

export const notificationService = new KalyaniNotificationManager();
