import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { AppRouter } from './routes';
import { notificationService } from './services/notificationService';
import { getTodayDateString } from './utils/dateUtils';

import { KalyaniSplashScreen } from './components/common/KalyaniSplashScreen';
import { InternetConnectivityScreen } from './components/common/InternetConnectivityScreen';
import { isDeviceOnline } from './utils/networkUtils';
import { getInitialTheme, applyTheme } from './utils/themeUtils';

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
    applyTheme(getInitialTheme());
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
    return () => {
      window.removeEventListener('dragstart', preventDrag);
    };
  }, [initStore, initAuth]);

  // Role-customized notifications: schedules morning reminder and delivers
  // launch update tailored specifically for the user's role (Faculty, HOD, Admin).
  useEffect(() => {
    if (!currentUser) return;

    // Distinguish between main HOD and AHOD/Faculty
    const effectiveRole: 'ADMIN' | 'HOD' | 'FACULTY' =
      currentUser.role === 'ADMIN'
        ? 'ADMIN'
        : currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD'
        ? 'HOD'
        : 'FACULTY';

    notificationService.native.ensureDailyReminder(
      effectiveRole,
      currentUser.name,
      currentUser.uid,
      currentUser.departmentId || 'CSE'
    );

    // Synchronize baseline period monitoring for user's department in native Android background manager.
    // IMPORTANT: only sync AFTER cloud hydration — syncing the stale local
    // cache first would overwrite a real HOD change with old count/sig and
    // permanently swallow the pending background notification.
    try {
      const hydrated = useAppStore.getState().isCloudHydrated;
      if (!hydrated) return;
      const userDept = currentUser.departmentId || 'CSE';
      const deptPeriods = useAppStore.getState().getActivePeriods(userDept);
      const signature = deptPeriods.map((p) => `${p.id}_${p.name}_${p.shortName || ''}_${p.startTime || ''}_${p.endTime || ''}_${p.sequence}`).sort().join('|');
      notificationService.syncBackgroundPeriodState(userDept, deptPeriods.length, signature);
    } catch (e) {
      console.warn('Initial period sync notice:', e);
    }
  }, [currentUser?.uid, currentUser?.role, currentUser?.hodType, currentUser?.departmentId, isCloudHydrated]);

  const handleSplashComplete = async () => {
    setShowSplash(false);

    // Clear any stale period notification from previous sessions
    try {
      await notificationService.native.clearPeriodNotification();

      if (currentUser) {
        const todayDate = new Date().toISOString().slice(0, 10);
        const todayKey = `${currentUser.uid}_${todayDate}`;
        const sched = useAppStore.getState().schedules[todayKey];
        const isSubmitted = Boolean(sched && sched.status && sched.status !== 'NOT_SUBMITTED');
        const effRole: 'ADMIN' | 'HOD' | 'FACULTY' =
          currentUser.role === 'ADMIN'
            ? 'ADMIN'
            : currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD'
            ? 'HOD'
            : 'FACULTY';
        await notificationService.native.notifyLoginOrPendingStatus(
          currentUser.uid,
          currentUser.name,
          effRole,
          isSubmitted,
          false
        );
      }
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

