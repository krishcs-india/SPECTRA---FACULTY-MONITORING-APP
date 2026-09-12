import React, { useState } from 'react';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';
import { KalyaniMandalaBackground } from '../common/KalyaniMandalaBackground';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9FB] dark:bg-[#0F0912] text-slate-800 dark:text-slate-100 relative flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-900 dark:selection:text-rose-200 transition-colors duration-300">
      {/* Visual Identity Watermark & Glow Background */}
      <KalyaniMandalaBackground />

      {/* Top Navbar */}
      <AppNavbar
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex relative z-10 max-w-7xl mx-auto w-full">
        {/* Left Sidebar */}
        <AppSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
