import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { AppRouter } from './routes';
import { KalyaniSplashScreen } from './components/common/KalyaniSplashScreen';
import { notificationService } from './services/notificationService';

export const App: React.FC = () => {
  const initStore = useAppStore((state) => state.initStore);
  const initAuth = useAuthStore((state) => state.initAuth);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initStore();
    initAuth();
    notificationService.init();
  }, [initStore, initAuth]);

  return (
    <>
      {showSplash && <KalyaniSplashScreen onComplete={() => setShowSplash(false)} />}
      <AppRouter />
    </>
  );
};

export default App;
