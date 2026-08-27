import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    loginWithEmail,
    loginWithAdminCredentials,
    loginAsUser,
    switchRoleQuickly,
    logout,
    clearError
  } = useAuthStore();

  const isAdmin = currentUser?.role === 'ADMIN';
  const isHOD = currentUser?.role === 'HOD' && currentUser?.hodType !== 'AHOD';
  const isAHOD = currentUser?.hodType === 'AHOD';
  const isFaculty = currentUser?.role === 'FACULTY' || isAHOD || currentUser?.role === 'HOD';

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isHOD,
    isAHOD,
    isFaculty,
    loginWithEmail,
    loginWithAdminCredentials,
    loginAsUser,
    switchRoleQuickly,
    logout,
    clearError
  };
};
