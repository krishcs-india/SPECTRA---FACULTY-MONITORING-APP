import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { AppRouter } from './routes';
import { notificationService } from './services/notificationService';
import { getTodayDateString } from './utils/dateUtils';

import { KalyaniSplashScreen } from './components/common/KalyaniSplashScreen';

export const App: React.FC = () => {
  const initStore = useAppStore((state) => state.initStore);
  const initAuth = useAuthStore((state) => state.initAuth);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isCloudHydrated = useAppStore((state) => state.isCloudHydrated);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initStore();
    initAuth();
    notificationService.init();
    // Opens downloaded files when their "download complete" notification is tapped
    notificationService.native.handleNotificationTaps();
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

  return (
    <>
      {showSplash && <KalyaniSplashScreen onComplete={() => setShowSplash(false)} />}
      <AppRouter />
    </>
  );
};

export default App;

