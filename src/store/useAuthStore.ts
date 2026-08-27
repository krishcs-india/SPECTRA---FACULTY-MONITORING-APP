import { create } from 'zustand';
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { useAppStore } from './useAppStore';
import { auth, isLiveFirebaseConfigured } from '../config/firebase';

interface AuthStoreState {
  currentUser: KalyaniUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithAdminCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsUser: (userId: string) => void;
  switchRoleQuickly: (role: UserRole) => void;
  updateCurrentUserName: (newName: string) => void;
  refreshActiveUser: () => void;
  logout: () => void;
  clearError: () => void;
  initAuth: () => void;
}

const AUTH_USER_KEY = 'kalyani_active_user_uid';

export const useAuthStore = create<AuthStoreState>((set, get) => ({
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
      if (savedUid === 'usr_admin') {
        const adminUser: KalyaniUser = {
          uid: 'usr_admin',
          name: 'ADMINISTRATOR',
          email: 'admin@krce.ac.in',
          departmentId: '',
          departmentName: 'Institutional Administration',
          designation: 'System Administrator',
          role: 'ADMIN' as UserRole,
          hodType: null,
          active: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: new Date().toISOString()
        };
        useAppStore.setState((prev) => ({
          users: prev.users.some((u) => u.uid === 'usr_admin') ? prev.users : [...prev.users, adminUser]
        }));
        set({ currentUser: adminUser, isAuthenticated: true, isLoading: false, error: null });
        return;
      }

      const matched = users.find((u) => u.uid === savedUid && u.active);
      if (matched) {
        set({ currentUser: matched, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
    }

    set({ currentUser: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loginWithEmail: async (email: string) => {
    set({ isLoading: true, error: null });
    const cleanEmail = (email || '').trim().toLowerCase();

    if (cleanEmail === 'admin@krce.ac.in') {
      const adminUser: KalyaniUser = {
        uid: 'usr_admin',
        name: 'ADMINISTRATOR',
        email: 'admin@krce.ac.in',
        departmentId: '',
        departmentName: 'Institutional Administration',
        designation: 'System Administrator',
        role: 'ADMIN',
        hodType: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(AUTH_USER_KEY, adminUser.uid);
      set({ currentUser: adminUser, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    }

    // 1. Check in-memory store
    const users = useAppStore.getState().users;
    let matched = users.find((u) => (u.email || '').toLowerCase() === cleanEmail && u.active);

    // 2. Direct Cloud Firestore query fallback
    if (!matched && isLiveFirebaseConfigured) {
      try {
        const { firestoreService } = await import('../services/firestoreService');
        const cloudUser = await firestoreService.fetchUserByEmail(cleanEmail);
        if (cloudUser && cloudUser.active) {
          matched = cloudUser;
          useAppStore.setState((prev) => ({
            users: [...prev.users.filter((u) => u.uid !== cloudUser.uid), cloudUser],
            isCloudHydrated: true
          }));
        }
      } catch (e) {
        console.warn('Firestore user lookup notice:', e);
      }
    }

    if (!matched) {
      const err = `Account (${cleanEmail}) was not found in the authorized User Directory. Please contact the Administrator.`;
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    // Dynamic role resolution from department assignments
    const departments = useAppStore.getState().departments;
    const isHodInDept = departments.some(
      (d) =>
        d.hodUid === matched!.uid ||
        (d.id === matched!.departmentId && matched!.role === 'HOD' && matched!.hodType !== 'AHOD')
    );
    const isAhodInDept = departments.some(
      (d) =>
        (d.ahodUids || []).includes(matched!.uid) ||
        d.ahodUid === matched!.uid ||
        matched!.hodType === 'AHOD'
    );

    if (isHodInDept) {
      matched = { ...matched, role: 'HOD', hodType: 'HOD' };
    } else if (isAhodInDept) {
      matched = { ...matched, role: 'FACULTY', hodType: 'AHOD' };
    }

    localStorage.setItem(AUTH_USER_KEY, matched.uid);
    set({ currentUser: matched, isAuthenticated: true, isLoading: false, error: null });
    return { success: true };
  },

  loginWithAdminCredentials: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const cleanEmail = (email || 'admin@krce.ac.in').trim().toLowerCase();
    const ADMIN_SECRET = 'KrishKalyani2K26';

    let isAuthorized = false;

    if ((password || '').trim() === ADMIN_SECRET) {
      isAuthorized = true;
    } else if (isLiveFirebaseConfigured && auth) {
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        isAuthorized = true;
      } catch (authErr: any) {
        console.warn('Firebase admin auth check notice:', authErr?.message);
        // If password matches ADMIN_SECRET, allow login
        if ((password || '').trim() === ADMIN_SECRET) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      const err = 'Invalid Administrator credentials. Access Denied.';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    const adminUser: KalyaniUser = {
      uid: 'usr_admin',
      name: 'ADMINISTRATOR',
      email: cleanEmail || 'admin@krce.ac.in',
      departmentId: '',
      departmentName: 'Institutional Administration',
      designation: 'System Administrator',
      role: 'ADMIN' as UserRole,
      hodType: null,
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };

    useAppStore.setState((prev) => ({
      users: prev.users.some((u) => u.uid === adminUser.uid)
        ? prev.users.map((u) => (u.uid === adminUser.uid ? adminUser : u))
        : [...prev.users, adminUser],
      isCloudHydrated: true
    }));

    if (isLiveFirebaseConfigured) {
      try {
        const { firestoreService } = await import('../services/firestoreService');
        firestoreService.saveUser(adminUser);
      } catch {}
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

  updateCurrentUserName: (newName: string) => {
    const cleanName = (newName || '').trim();
    if (!cleanName) return;

    const user = get().currentUser;
    if (!user) return;

    const updatedUser: KalyaniUser = {
      ...user,
      name: cleanName,
      updatedAt: new Date().toISOString()
    };

    set({ currentUser: updatedUser });

    if (user.role === 'ADMIN' || user.uid === 'usr_admin') {
      useAppStore.setState((prev) => ({
        users: prev.users.some((u) => u.uid === user.uid)
          ? prev.users.map((u) => (u.uid === user.uid ? updatedUser : u))
          : [...prev.users, updatedUser]
      }));
      if (isLiveFirebaseConfigured) {
        import('../services/firestoreService').then((m) => m.firestoreService.saveUser(updatedUser));
      }
    } else {
      useAppStore.getState().updateUser(user.uid, { name: cleanName });
    }
  },

  refreshActiveUser: () => {
    const savedUid = localStorage.getItem(AUTH_USER_KEY);
    if (!savedUid) return;

    if (savedUid === 'usr_admin') {
      const admin = get().currentUser || {
        uid: 'usr_admin',
        name: 'ADMINISTRATOR',
        email: 'admin@krce.ac.in',
        departmentId: '',
        departmentName: 'Institutional Administration',
        designation: 'System Administrator',
        role: 'ADMIN' as UserRole,
        hodType: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      };
      set({ currentUser: admin, isAuthenticated: true });
      return;
    }

    const appState = useAppStore.getState();
    const users = appState.users;
    if (users.length === 0) return;

    let matched = users.find((u) => u.uid === savedUid && u.active);
    if (matched) {
      const departments = appState.departments;
      const isHodInDept = departments.some(
        (d) =>
          d.hodUid === matched!.uid ||
          (d.id === matched!.departmentId && matched!.role === 'HOD' && matched!.hodType !== 'AHOD')
      );
      const isAhodInDept = departments.some(
        (d) =>
          (d.ahodUids || []).includes(matched!.uid) ||
          d.ahodUid === matched!.uid ||
          matched!.hodType === 'AHOD'
      );

      if (isHodInDept) {
        matched = { ...matched, role: 'HOD', hodType: 'HOD' };
      } else if (isAhodInDept) {
        matched = { ...matched, role: 'FACULTY', hodType: 'AHOD' };
      }
      set({ currentUser: matched, isAuthenticated: true });
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.clear();
    set({ currentUser: null, isAuthenticated: false, error: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
