import { useAuthStore } from '../store/useAuthStore';

export function useCurrentUser() {
  const currentUser = useAuthStore(state => state.currentUser);

  return {
    currentUser,
    role: currentUser?.role || null,
    hodType: currentUser?.hodType || null,
    departmentId: currentUser?.departmentId || null
  };
}
