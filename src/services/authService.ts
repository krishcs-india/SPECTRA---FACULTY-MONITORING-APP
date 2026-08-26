import { auth, googleProvider, isLiveFirebaseConfigured } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export const authService = {
  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (isLiveFirebaseConfigured) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email;
        if (!email) {
          return { success: false, error: 'Google account did not provide an email address.' };
        }

        // Enforce college domain whitelist when enabled in Global Settings
        const settings = useAppStore.getState().systemSettings;
        if (settings.enforceDomainCheck && settings.collegeDomain) {
          const domain = settings.collegeDomain.trim().toLowerCase();
          if (domain && !email.toLowerCase().endsWith('@' + domain)) {
            try { await firebaseSignOut(auth); } catch {}
            return { success: false, error: `Only @${domain} accounts are permitted to access this system.` };
          }
        }

        return await useAuthStore.getState().loginWithEmail(email);
      } catch (err: any) {
        console.error('Firebase Google Sign-In error:', err);
        return { success: false, error: err.message || 'Failed to authenticate with Google.' };
      }
    } else {
      // Direct demo login or simulation
      const users = (await import('../services/seedDataService')).INITIAL_USERS;
      const defaultUser = users.find(u => u.role === 'HOD') || users[0];
      useAuthStore.getState().loginAsUser(defaultUser.uid);
      return { success: true };
    }
  },

  async signOut(): Promise<void> {
    if (isLiveFirebaseConfigured && auth?.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout error:', e);
      }
    }
    useAuthStore.getState().logout();
  }
};
