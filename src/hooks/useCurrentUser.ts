import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export function useCurrentUser() {
  const currentUser = useAuthStore(state => state.currentUser);
  const getDepartmentConfig = useAppStore(state => state.getDepartmentConfig);

  const departmentConfig = currentUser ? getDepartmentConfig(currentUser.departmentId) : null;

  return {
    currentUser,
    departmentConfig,
    role: currentUser?.role || null,
    hodType: currentUser?.hodType || null,
    departmentId: currentUser?.departmentId || null
  };
}
