import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { AppRouter } from './routes';
import { notificationService } from './services/notificationService';
import { getTodayDateString } from './utils/dateUtils';

import { KalyaniSplashScreen } from './components/common/KalyaniSplashScreen';
import { InternetConnectivityScreen } from './components/common/InternetConnectivityScreen';
import { isDeviceOnline } from './utils/networkUtils';

export const App: React.FC = () => {
  const initStore = useAppStore((state) => state.initStore);
  const initAuth = useAuthStore((state) => state.initAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isCloudHydrated = useAppStore((state) => state.isCloudHydrated);
  const [showSplash, setShowSplash] = useState(true);
  const [showOfflineScreen, setShowOfflineScreen] = useState(false);
  const isOnlineAtStartupRef = React.useRef<boolean | null>(null);

  // Background probe while splash screen is displaying
  useEffect(() => {
    const probe = async () => {
      const online = await isDeviceOnline();
      isOnlineAtStartupRef.current = online;
    };
    probe();
  }, []);

  useEffect(() => {
    initStore();
    initAuth();
    notificationService.init();
    // Opens downloaded files when their "download complete" notification is tapped
    notificationService.native.handleNotificationTaps();

    // Prevent image dragging across the entire application
    const preventDrag = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement || (e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    window.addEventListener('dragstart', preventDrag);
    return () => window.removeEventListener('dragstart', preventDrag);
  }, [initStore, initAuth]);

  // Daily native notification: nudge faculty/AHOD when today's schedule
  // is still pending, plus register the recurring morning reminder.
  // Main HOD does not submit daily schedules — no notification for him.
  useEffect(() => {
    if (!currentUser || !isCloudHydrated) return;
    if (currentUser.role === 'ADMIN') return;
    const isMainHod = currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD';
    if (isMainHod) return;

    notificationService.native.ensureDailyReminder();
    const todaySchedule = useAppStore.getState().getSchedule(currentUser.uid, getTodayDateString());
    notificationService.native.notifyIfPendingToday(
      currentUser.uid,
      currentUser.name,
      todaySchedule?.status === 'SUBMITTED' || todaySchedule?.status === 'FULL_DAY_FREE'
    );
  }, [currentUser?.uid, isCloudHydrated]);

  const handleSplashComplete = async () => {
    setShowSplash(false);

    // Request notification and system permissions right after the splash screen finishes
    try {
      await notificationService.requestPermissions();
    } catch (err) {
      console.warn('Post-splash permission request error:', err);
    }

    let isOnline = isOnlineAtStartupRef.current;
    if (isOnline === null) {
      isOnline = await isDeviceOnline();
    }
    if (!isOnline) {
      setShowOfflineScreen(true);
    }
  };

  return (
    <>
      {showSplash && <KalyaniSplashScreen onComplete={handleSplashComplete} />}
      {showOfflineScreen && (
        <InternetConnectivityScreen onConnected={() => setShowOfflineScreen(false)} />
      )}
      <AppRouter />
    </>
  );
};

export default App;

