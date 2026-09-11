import React from 'react';
import { KalyaniLogo } from '../common/KalyaniLogo';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { LogOut, Menu } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <KalyaniLogo size="sm" showSubtitle={false} />
        </div>

        {/* Right: Authenticated User Profile, Theme Toggle & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User Role Badge (hidden on small phones to prevent overflow) */}
          <div className="hidden md:flex h-9 items-center gap-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm" />
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 sm:pl-2 sm:border-l sm:border-slate-800">
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl hover:bg-white/5 transition-all duration-200"
              title="View My Profile"
            >
              <div className="hidden sm:flex flex-col justify-center text-right h-9">
                <p className="text-sm font-semibold font-marcellus text-slate-200 group-hover:text-blue-400 truncate max-w-[180px] tracking-wide leading-tight transition-colors">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[180px] font-medium leading-tight">
                  {currentUser?.hodType === 'AHOD' ? 'Assistant HOD' : currentUser?.designation}
                </p>
              </div>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 group-hover:border-blue-400 flex items-center justify-center font-bold text-xs text-white shadow-sm select-none shrink-0 group-hover:scale-105 transition-transform">
                <span className="leading-none">{currentUser?.name?.charAt(0) || 'U'}</span>
              </div>
            </div>

            <button
              onClick={() => authService.signOut()}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all duration-200 apple-hover shadow-sm shrink-0"
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
