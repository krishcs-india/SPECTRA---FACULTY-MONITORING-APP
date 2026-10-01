import React from 'react';
import { KalyaniLogo } from '../common/KalyaniLogo';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { LogOut, Menu } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { NavbarUserAvatar } from './NavbarUserAvatar';

interface AppNavbarProps {
  onToggleSidebar?: () => void;
  onNavigate?: (path: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { currentUser } = useAuth();

  const getProfilePath = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'ADMIN') return '/admin/profile';
    if (currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD') return '/hod/profile';
    return '/faculty/profile';
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate(getProfilePath());
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-[#0F0912]/95 backdrop-blur-2xl transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-white/10 transition-colors shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <KalyaniLogo size="sm" showSubtitle={false} />
        </div>

        {/* Right: Authenticated User Profile, Theme Toggle & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User Role Badge (hidden on small phones to prevent overflow) */}
          <div className="hidden md:flex h-9 items-center gap-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-400/50" />
            <span className="uppercase font-bold tracking-wider">
              {currentUser?.role === 'ADMIN'
                ? 'Admin'
                : currentUser?.role === 'HOD'
                ? 'HOD'
                : currentUser?.hodType === 'AHOD'
                ? 'Assistant HOD'
                : 'Faculty'}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Profile Badge (Clickable) & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 sm:pl-2 sm:border-l sm:border-rose-200 dark:sm:border-rose-950/80">
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl hover:bg-rose-50/80 dark:hover:bg-white/5 transition-all duration-200"
              title="View My Profile"
            >
              <div className="hidden sm:flex flex-col justify-center text-right h-9">
                <p className="text-sm font-semibold font-marcellus text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate max-w-[180px] tracking-wide leading-tight transition-colors">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-medium leading-tight">
                  {currentUser?.hodType === 'AHOD' ? 'Assistant HOD' : currentUser?.designation}
                </p>
              </div>

              <NavbarUserAvatar role={currentUser?.role} name={currentUser?.name} />
            </div>

            <button
              onClick={() => authService.signOut()}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/15 border border-rose-200/80 dark:border-white/10 dark:hover:border-rose-500/30 text-rose-700 dark:text-slate-300 hover:text-rose-800 dark:hover:text-rose-300 text-xs font-semibold transition-all duration-200 apple-hover shadow-sm shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
