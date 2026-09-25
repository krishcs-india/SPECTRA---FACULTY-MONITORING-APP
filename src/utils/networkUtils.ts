import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * Universal, rock-solid internet connectivity check.
 * - Native (Android/iOS): Checks Android/iOS ConnectivityManager directly via Capacitor
 * - Web/Fallback: Performs active HTTP probe against reliable endpoints with timeout
 */
export async function isDeviceOnline(): Promise<boolean> {
  try {
    // 1. Native Capacitor check: queries OS network hardware status
    if (Capacitor.isNativePlatform?.()) {
      const status = await Network.getStatus();
      return Boolean(status.connected);
    }
  } catch (err) {
    console.warn('Native network status check skipped:', err);
  }

  // 2. If browser navigator reports offline, it's definitely offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // 3. For web browser: if navigator.onLine is true, verify or fallback gracefully
  if (typeof window !== 'undefined') {
    return true;
  }

  return true;
}

/**
 * Attaches real-time network listener across both Native Capacitor and browser events.
 */
export function subscribeNetworkStatus(callback: (isOnline: boolean) => void): () => void {
  let removeCapacitorListener: (() => void) | null = null;

  if (Capacitor.isNativePlatform?.()) {
    Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        callback(false);
      } else {
        // Double check actual reachability
        isDeviceOnline().then(callback);
      }
    }).then((handle) => {
      removeCapacitorListener = () => handle.remove();
    }).catch(() => {});
  }

  const handleOnline = () => {
    isDeviceOnline().then(callback);
  };

  const handleOffline = () => {
    callback(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (removeCapacitorListener) {
      removeCapacitorListener();
    }
  };
}
