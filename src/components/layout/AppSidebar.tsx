import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import {
  CalendarDays,
  History,
  User,
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  Settings,
  ShieldCheck,
  Building2,
  Sparkles,
  BarChart3,
  CalendarRange
} from 'lucide-react';

interface AppSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'FACULTY';
  const departments = useAppStore((state) => state.departments);
  const departmentCode = currentUser
    ? departments.find((d) => d.id === currentUser.departmentId)?.code
    : undefined;

  const facultyNav = [
    { label: "Today's Schedule", path: '/faculty/schedule', icon: CalendarDays },
    { label: 'Past History', path: '/faculty/history', icon: History },
    { label: 'My Profile', path: '/faculty/profile', icon: User },
  ];

  const hodNav = [
    { label: 'Live Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
    { label: 'Period Availability', path: '/hod/availability', icon: BarChart3 },
    { label: 'Faculty Directory', path: '/hod/faculty', icon: Users },
    { label: 'Subject Master', path: '/hod/subjects', icon: BookOpen },
    { label: 'Period Manager', path: '/hod/periods', icon: Clock },
    { label: 'Historical Matrix', path: '/hod/history', icon: CalendarRange },
    { label: 'My Profile', path: '/hod/profile', icon: User },
  ];

  const adminNav = [
    { label: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Directory & XLS', path: '/admin/users', icon: Users },
    { label: 'HOD Assignments', path: '/admin/hod-management', icon: Sparkles },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'System Settings', path: '/admin/settings', icon: ShieldCheck },
    { label: 'My Profile', path: '/admin/profile', icon: User },
  ];

  let currentNav = facultyNav;
  let sectionTitle = currentUser?.hodType === 'AHOD' ? 'Assistant HOD' : 'Faculty Portal';

  // ONLY Main HOD sees HOD Management navigation. AHOD is a faculty with Assistant HOD title
  if (role === 'HOD' && currentUser?.hodType !== 'AHOD') {
    currentNav = hodNav;
    sectionTitle = 'HOD Management';
  } else if (role === 'ADMIN') {
    currentNav = adminNav;
    sectionTitle = 'Administrator';
  }

  const handleNavClick = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-14 sm:top-16 bottom-0 left-0 z-40 w-64 border-r border-rose-200/80 dark:border-rose-950/60 bg-white/95 dark:bg-[#0F0912]/95 backdrop-blur-2xl p-4 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 shadow-sm ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Section Banner */}
          <div className="px-3 py-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              {sectionTitle}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-xs">
              {currentUser?.hodType === 'AHOD' ? 'AHOD' : role !== 'ADMIN' && departmentCode ? departmentCode : role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 apple-hover select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500/15 to-pink-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-300/80 dark:border-rose-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-slate-100 hover:bg-rose-50/70 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Department Tag / Footer Badge */}
        <div className="pt-4 border-t border-rose-200/80 dark:border-rose-950/80">
          <div className="p-3 rounded-2xl kalyani-glass flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 text-xs font-bold select-none">
              {currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || (role === 'ADMIN' ? 'A' : 'F')}
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate font-marcellus">
                {role === 'ADMIN'
                  ? 'Institutional Administration'
                  : currentUser?.departmentName || 'Academic Department'}
              </p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 truncate font-medium">
                {role === 'ADMIN'
                  ? 'System Root • Live Sync'
                  : role === 'HOD' && currentUser?.hodType !== 'AHOD'
                  ? 'HOD Portal • Live Sync'
                  : 'Faculty Portal • Live Sync'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
