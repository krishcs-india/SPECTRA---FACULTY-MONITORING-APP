import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { AppRouter } from './routes';
import { notificationService } from './services/notificationService';
import { getTodayDateString } from './utils/dateUtils';

import { KalyaniSplashScreen } from './components/common/KalyaniSplashScreen';
import { InternetConnectivityScreen } from './components/common/InternetConnectivityScreen';

export const App: React.FC = () => {
  const initStore = useAppStore((state) => state.initStore);
  const initAuth = useAuthStore((state) => state.initAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isCloudHydrated = useAppStore((state) => state.isCloudHydrated);
  const [showSplash, setShowSplash] = useState(true);
  const [showOfflineScreen, setShowOfflineScreen] = useState(false);
  const isOnlineAtStartupRef = React.useRef<boolean>(navigator.onLine);

  // Background probe while splash screen is displaying
  useEffect(() => {
    const probe = async () => {
      if (!navigator.onLine) {
        isOnlineAtStartupRef.current = false;
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(`https://www.google.com/favicon.ico?_kalyani_probe=${Date.now()}`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        isOnlineAtStartupRef.current = true;
      } catch {
        isOnlineAtStartupRef.current = navigator.onLine;
      }
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

  const handleSplashComplete = () => {
    setShowSplash(false);
    // If not online at startup, show the dedicated connectivity screen to wait for connection
    if (!isOnlineAtStartupRef.current && !navigator.onLine) {
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

