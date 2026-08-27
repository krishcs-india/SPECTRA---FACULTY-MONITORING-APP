import { auth, isLiveFirebaseConfigured } from '../config/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export const authService = {
  /**
   * Institutional Email Verification & Login
   */
  async loginWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered college email.' };
    }

    return await useAuthStore.getState().loginWithEmail(cleanEmail);
  },

  /** No-op for backwards compatibility */
  async initRedirectLogin(): Promise<void> {},

  async signOut(): Promise<void> {
    if (isLiveFirebaseConfigured && auth?.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Firebase signout notice:', e);
      }
    }
    useAuthStore.getState().logout();
  }
};

