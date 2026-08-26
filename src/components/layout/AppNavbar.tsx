import React from 'react';
import { KalyaniLogo } from '../common/KalyaniLogo';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { LogOut, Menu } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full border-b border-kalyani-gold-500/20 bg-kalyani-crimson-950/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <KalyaniLogo size="sm" showSubtitle={false} />
        </div>

        {/* Right: Authenticated User Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* User Role Badge (Read-only status) */}
          <div className="h-9 flex items-center gap-2 px-3 rounded-xl bg-kalyani-crimson-900/80 border border-kalyani-gold-500/30 text-xs font-semibold text-kalyani-gold-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-kalyani-gold-400 shadow-[0_0_8px_#D4AF37]" />
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

          {/* User Profile Badge (Clickable) & Logout */}
          <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-kalyani-gold-500/20">
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl hover:bg-white/5 transition-all duration-200"
              title="View My Profile"
            >
              <div className="hidden sm:flex flex-col justify-center text-right h-9">
                <p className="text-base font-cursive text-kalyani-gold-200 group-hover:text-gold-gradient truncate max-w-[180px] tracking-wide leading-tight transition-colors">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-kalyani-gold-300/80 truncate max-w-[180px] font-semibold leading-tight">
                  {currentUser?.hodType === 'AHOD' ? 'Assistant HOD' : currentUser?.designation}
                </p>
              </div>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-kalyani-crimson-800 to-kalyani-gold-700 border border-kalyani-gold-400/40 group-hover:border-kalyani-gold-400 flex items-center justify-center font-bold text-xs text-kalyani-gold-100 shadow-gold-sm select-none shrink-0 group-hover:scale-105 transition-transform">
                <span className="leading-none">{currentUser?.name?.charAt(0) || 'U'}</span>
              </div>
            </div>

            <button
              onClick={() => authService.signOut()}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all duration-200 apple-hover shadow-sm shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
