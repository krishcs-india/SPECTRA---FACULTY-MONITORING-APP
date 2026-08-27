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
      if (!status.connected) {
        return false;
      }
    }
  } catch (err) {
    console.warn('Native network status check skipped:', err);
  }

  // 2. If browser navigator reports offline, it's definitely offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // 3. Active HTTP probe with 2.5s timeout to guarantee actual internet packet routing
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    await fetch(`https://www.google.com/favicon.ico?_kalyani_net=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true;
  } catch (err: any) {
    // Try secondary lightweight endpoint if first failed due to specific domain block
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 2000);

      await fetch(`https://1.1.1.1/cdn-cgi/trace?_kalyani_net=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);
      return true;
    } catch {
      // Both network probes failed -> No actual internet routing
      return false;
    }
  }
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
