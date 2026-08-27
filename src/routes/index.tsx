import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import { isLiveFirebaseConfigured } from '../config/firebase';
import { AppLayout } from '../components/layout/AppLayout';
import { RoleGuard } from '../components/layout/RoleGuard';
import { LoginPage } from '../pages/auth/LoginPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

// Faculty Pages
import { FacultySchedulePage } from '../pages/faculty/FacultySchedulePage';
import { FacultyHistoryPage } from '../pages/faculty/FacultyHistoryPage';
import { FacultyProfilePage } from '../pages/faculty/FacultyProfilePage';

// HOD Pages
import { HodDashboardPage } from '../pages/hod/HodDashboardPage';
import { HodAvailabilityPage } from '../pages/hod/HodAvailabilityPage';
import { HodFacultyPage } from '../pages/hod/HodFacultyPage';
import { HodSubjectsPage } from '../pages/hod/HodSubjectsPage';
import { HodPeriodsPage } from '../pages/hod/HodPeriodsPage';
import { HodHistoryPage } from '../pages/hod/HodHistoryPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminHodManagementPage } from '../pages/admin/AdminHodManagementPage';
import { AdminDepartmentsPage } from '../pages/admin/AdminDepartmentsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

export const AppRouter: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const maintenanceMode = useAppStore((state) => state.systemSettings?.maintenanceMode);
  const isCloudHydrated = useAppStore((state) => state.isCloudHydrated);
  // MUST be declared here — before any conditional returns — to satisfy React Rules of Hooks
  const users = useAppStore((state) => state.users);

  // Get default landing route based on active user role
  const getDefaultPath = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'ADMIN') return '/admin/dashboard';
    // ONLY Main HOD lands on /hod/dashboard. AHOD is a faculty with Assistant HOD title
    if (currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD') return '/hod/dashboard';
    return '/faculty/schedule';
  };

  const normalizePath = (rawPath: string): string => {
    if (!rawPath || rawPath === '/' || rawPath === '/index.html' || rawPath.endsWith('/index.html')) {
      return '';
    }
    return rawPath;
  };

  // Helper to verify if path is allowed for role
  const isPathAllowedForRole = (path: string, role?: string, hodType?: string | null) => {
    if (!role || !path) return false;
    if (path.startsWith('/admin') && role !== 'ADMIN') return false;
    // ONLY Main HOD (not AHOD) can access /hod routes
    if (path.startsWith('/hod') && (role !== 'HOD' || hodType === 'AHOD') && role !== 'ADMIN') return false;
    return true;
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const raw = typeof window !== 'undefined' ? window.location.pathname : '';
    const normalized = normalizePath(raw);
    return normalized && isPathAllowedForRole(normalized, currentUser?.role, currentUser?.hodType)
      ? normalized
      : getDefaultPath();
  });

  // Keep route strictly synchronized whenever user/role changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const normalized = normalizePath(currentPath);
      if (
        !normalized ||
        normalized === '/login' ||
        !isPathAllowedForRole(normalized, currentUser.role, currentUser.hodType)
      ) {
        setCurrentPath(getDefaultPath());
      }
    } else if (!isAuthenticated) {
      setCurrentPath('/login');
    }
  }, [isAuthenticated, currentUser?.uid, currentUser?.role, currentUser?.hodType, currentPath]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const normalized = normalizePath(window.location.pathname);
      if (normalized && isPathAllowedForRole(normalized, currentUser?.role, currentUser?.hodType)) {
        setCurrentPath(normalized);
      } else {
        setCurrentPath(getDefaultPath());
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser?.role, currentUser?.hodType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kalyani-crimson-950 flex items-center justify-center text-kalyani-gold-300 font-semibold text-xs tracking-widest uppercase">
        Initializing Kalyani System…
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }


  // Live mode: briefly show spinner for non-admin on first boot with no data
  if (isLiveFirebaseConfigured && !isCloudHydrated && (users || []).length === 0 && currentUser?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-kalyani-crimson-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-kalyani-gold-500/30 border-t-kalyani-gold-400 rounded-full animate-spin" />
        <p className="text-kalyani-gold-300 font-semibold text-xs tracking-widest uppercase">
          Synchronizing with Cloud Database…
        </p>
      </div>
    );
  }

  // Maintenance mode: only Administrators may pass through
  if (maintenanceMode && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-kalyani-crimson-950 flex flex-col items-center justify-center text-center px-6 gap-3">
        <h1 className="text-kalyani-gold-300 font-bold text-xl tracking-wide">System Maintenance in Progress</h1>
        <p className="text-slate-300 text-sm max-w-md">
          Kalyani is temporarily unavailable while the administrator performs maintenance.
          Please check back again shortly.
        </p>
      </div>
    );
  }

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    try {
      if (typeof window !== 'undefined' && window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render matching view
  const renderCurrentView = () => {
    switch (currentPath) {
      // Faculty Views
      case '/faculty/schedule':
        return (
          <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <FacultySchedulePage />
          </RoleGuard>
        );
      case '/faculty/history':
        return (
          <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <FacultyHistoryPage />
          </RoleGuard>
        );
      case '/faculty/profile':
        return (
          <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <FacultyProfilePage />
          </RoleGuard>
        );

      // HOD Views
      case '/hod/dashboard':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodDashboardPage />
          </RoleGuard>
        );
      case '/hod/availability':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodAvailabilityPage />
          </RoleGuard>
        );
      case '/hod/faculty':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodFacultyPage />
          </RoleGuard>
        );
      case '/hod/subjects':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodSubjectsPage />
          </RoleGuard>
        );
      case '/hod/periods':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodPeriodsPage />
          </RoleGuard>
        );
      case '/hod/history':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodHistoryPage />
          </RoleGuard>
        );
      case '/hod/profile':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <FacultyProfilePage />
          </RoleGuard>
        );

      // Admin Views
      case '/admin/dashboard':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminDashboardPage onNavigate={navigateTo} />
          </RoleGuard>
        );
      case '/admin/users':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminUsersPage />
          </RoleGuard>
        );
      case '/admin/hod-management':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminHodManagementPage />
          </RoleGuard>
        );
      case '/admin/departments':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminDepartmentsPage />
          </RoleGuard>
        );
      case '/admin/settings':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminSettingsPage />
          </RoleGuard>
        );
      case '/admin/profile':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <FacultyProfilePage />
          </RoleGuard>
        );

      default: {
        // Strict Role-Based fallback
        if (currentUser.role === 'ADMIN') {
          return (
            <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo('/admin/dashboard')}>
              <AdminDashboardPage onNavigate={navigateTo} />
            </RoleGuard>
          );
        }
        if (currentUser.role === 'HOD') {
          return (
            <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo('/hod/dashboard')}>
              <HodDashboardPage />
            </RoleGuard>
          );
        }
        return (
          <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo('/faculty/schedule')}>
            <FacultySchedulePage />
          </RoleGuard>
        );
      }
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigateTo}>
      {renderCurrentView()}
    </AppLayout>
  );
};
