import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
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
import { HodConfigurationPage } from '../pages/hod/HodConfigurationPage';
import { HodHistoryPage } from '../pages/hod/HodHistoryPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminHodManagementPage } from '../pages/admin/AdminHodManagementPage';
import { AdminDepartmentsPage } from '../pages/admin/AdminDepartmentsPage';
import { AdminPeriodsPage } from '../pages/admin/AdminPeriodsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

export const AppRouter: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const maintenanceMode = useAppStore((state) => state.systemSettings.maintenanceMode);

  // Get default landing route based on active user role
  const getDefaultPath = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'ADMIN') return '/admin/dashboard';
    // ONLY Main HOD lands on /hod/dashboard. AHOD is a faculty with Assistant HOD title
    if (currentUser.role === 'HOD' && currentUser.hodType !== 'AHOD') return '/hod/dashboard';
    return '/faculty/schedule';
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname !== '/' ? window.location.pathname : getDefaultPath();
  });

  // Helper to verify if path is allowed for role
  const isPathAllowedForRole = (path: string, role?: string, hodType?: string | null) => {
    if (!role) return false;
    if (path.startsWith('/admin') && role !== 'ADMIN') return false;
    // ONLY Main HOD (not AHOD) can access /hod routes
    if (path.startsWith('/hod') && (role !== 'HOD' || hodType === 'AHOD') && role !== 'ADMIN') return false;
    return true;
  };

  // Keep route strictly synchronized whenever user/role changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (
        currentPath === '/login' ||
        currentPath === '/' ||
        !isPathAllowedForRole(currentPath, currentUser.role, currentUser.hodType)
      ) {
        setCurrentPath(getDefaultPath());
      }
    } else if (!isAuthenticated) {
      setCurrentPath('/login');
    }
  }, [isAuthenticated, currentUser?.uid, currentUser?.role, currentUser?.hodType]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      case '/hod/configuration':
        return (
          <RoleGuard allowedRoles={['HOD', 'ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <HodConfigurationPage />
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
      case '/admin/periods':
        return (
          <RoleGuard allowedRoles={['ADMIN']} onRedirectToDefault={() => navigateTo(getDefaultPath())}>
            <AdminPeriodsPage />
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
