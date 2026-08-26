import { create } from 'zustand';
import { KalyaniUser, UserRole } from '../types/user';
import { useAppStore } from './useAppStore';

interface AuthStoreState {
  currentUser: KalyaniUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithAdminSecret: (secret: string) => Promise<{ success: boolean; error?: string }>;
  loginAsUser: (userId: string) => void;
  switchRoleQuickly: (role: UserRole) => void;
  refreshActiveUser: () => void;
  logout: () => void;
  clearError: () => void;
  initAuth: () => void;
}

const AUTH_USER_KEY = 'kalyani_active_user_uid';

export const useAuthStore = create<AuthStoreState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: () => {
    const appStore = useAppStore.getState();
    if (!appStore.isInitialized) {
      appStore.initStore();
    }

    const savedUid = localStorage.getItem(AUTH_USER_KEY);
    const users = useAppStore.getState().users;

    if (savedUid) {
      const matched = users.find((u) => u.uid === savedUid && u.active);
      if (matched) {
        set({ currentUser: matched, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      // Invalid/deactivated user token cleanup
      localStorage.removeItem(AUTH_USER_KEY);
    }

    // STRICT SECURITY: If no authenticated session exists, user MUST land on the Login screen.
    // Never auto-authenticate without explicit user action or valid stored session token.
    set({ currentUser: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loginWithEmail: async (email: string) => {
    set({ isLoading: true, error: null });
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in-memory store
    const users = useAppStore.getState().users;
    let matched = users.find((u) => u.email.toLowerCase() === cleanEmail && u.active);

    // 2. Direct Firestore fallback if not found in local memory
    if (!matched) {
      try {
        const { firestoreService } = await import('../services/firestoreService');
        const cloudUser = await firestoreService.fetchUserByEmail(cleanEmail);
        if (cloudUser && cloudUser.active) {
          matched = cloudUser;
          // Hydrate into local memory store
          useAppStore.setState((prev) => ({
            users: [...prev.users.filter((u) => u.uid !== cloudUser.uid), cloudUser]
          }));
        }
      } catch (e) {
        console.warn('Firestore user lookup fallback error:', e);
      }
    }

    if (!matched) {
      const err = `This account (${cleanEmail}) is not found in the authorized User Directory. Please create this account in Admin -> User Directory & XLS first.`;
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    localStorage.setItem(AUTH_USER_KEY, matched.uid);
    set({ currentUser: matched, isAuthenticated: true, isLoading: false, error: null });
    return { success: true };
  },

  loginWithAdminSecret: async (secret: string) => {
    set({ isLoading: true, error: null });
    const ADMIN_SECRET = 'KrishKalyani2K26';

    if (secret.trim() !== ADMIN_SECRET) {
      const err = 'Invalid Administrator Secret Key. Access Denied.';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    const users = useAppStore.getState().users;
    let adminUser = users.find((u) => u.role === 'ADMIN' && u.active);

    if (!adminUser) {
      adminUser = {
        uid: 'usr_admin',
        name: 'Dr. K. S. Rajan',
        email: 'admin@krce.ac.in',
        departmentId: 'dept_cse',
        departmentName: 'Computer Science & Engineering',
        designation: 'Principal & Chief Administrator',
        role: 'ADMIN',
        hodType: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };
    }

    localStorage.setItem(AUTH_USER_KEY, adminUser.uid);
    set({ currentUser: adminUser, isAuthenticated: true, isLoading: false, error: null });
    return { success: true };
  },

  loginAsUser: (userId: string) => {
    const users = useAppStore.getState().users;
    const user = users.find((u) => u.uid === userId && u.active);
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, user.uid);
      set({ currentUser: user, isAuthenticated: true, isLoading: false, error: null });
    }
  },

  switchRoleQuickly: (role: UserRole) => {
    const users = useAppStore.getState().users;
    const user = users.find((u) => u.role === role && u.active);
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, user.uid);
      set({ currentUser: user, isAuthenticated: true, isLoading: false, error: null });
    }
  },

  refreshActiveUser: () => {
    const savedUid = localStorage.getItem(AUTH_USER_KEY);
    if (!savedUid) return;
    const users = useAppStore.getState().users;
    const matched = users.find((u) => u.uid === savedUid && u.active);
    if (matched) {
      set({ currentUser: matched, isAuthenticated: true });
    }
  },

  logout: () => {
    // Completely flush stored session token and clear active state
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.clear();
    set({ currentUser: null, isAuthenticated: false, error: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
