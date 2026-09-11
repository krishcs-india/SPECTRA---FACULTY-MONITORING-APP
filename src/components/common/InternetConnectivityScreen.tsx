import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KalyaniCard } from './KalyaniCard';
import { KalyaniButton } from './KalyaniButton';
import { KalyaniMandalaBackground } from './KalyaniMandalaBackground';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Sparkles, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { isDeviceOnline, subscribeNetworkStatus } from '../../utils/networkUtils';

interface InternetConnectivityScreenProps {
  onConnected: () => void;
}

export const InternetConnectivityScreen: React.FC<InternetConnectivityScreenProps> = ({ onConnected }) => {
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'RECONNECTED'>('DISCONNECTED');
  const [isChecking, setIsChecking] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(2);
  const hasTriggeredConnectRef = useRef(false);

  const verifyConnection = useCallback(async () => {
    if (hasTriggeredConnectRef.current) return;
    setIsChecking(true);
    const reachable = await isDeviceOnline();
    setIsChecking(false);

    if (reachable) {
      hasTriggeredConnectRef.current = true;
      setConnectionStatus('RECONNECTED');
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#2DD4BF', '#D4AF37', '#10B981']
        });
      } catch {}
    }
  }, []);

  // Live real-time network listener (Capacitor Native + Browser) + backup interval polling
  useEffect(() => {
    const unsubscribe = subscribeNetworkStatus((online) => {
      if (online && !hasTriggeredConnectRef.current) {
        verifyConnection();
      }
    });

    const pollInterval = setInterval(() => {
      if (connectionStatus === 'DISCONNECTED' && !hasTriggeredConnectRef.current) {
        verifyConnection();
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [verifyConnection, connectionStatus]);

  // Once connection is detected, stay on this page for ~2 seconds so user clearly sees the success confirmation, then enter app
  useEffect(() => {
    if (connectionStatus === 'RECONNECTED') {
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);

      const redirectTimer = setTimeout(() => {
        onConnected();
      }, 2000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }
  }, [connectionStatus, onConnected]);

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none">
      <KalyaniMandalaBackground />

      {/* Top Bar Branding */}
      <header className="relative z-10 w-full max-w-lg flex items-center justify-between pt-2 sm:pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm">
            S
          </div>
          <span className="font-marcellus text-lg text-white font-normal tracking-wider">
            SPECTRA
          </span>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Institutional Cloud</span>
        </div>
      </header>

      {/* Center Interactive Connectivity Card */}
      <div className="relative z-10 w-full max-w-md my-auto animate-in zoom-in-95 fade-in duration-300">
        <KalyaniCard
          variant="elevated"
          className="border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-3xl text-center relative overflow-hidden"
        >
          {connectionStatus === 'DISCONNECTED' ? (
            <div className="space-y-5">
              {/* Disconnected Icon with Radar Pulse */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-rose-950 via-kalyani-crimson-900 to-rose-900 border border-rose-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(244,63,94,0.3)]">
                  <WifiOff className="w-10 h-10 text-rose-400 animate-pulse" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>No Network Detected</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-normal text-slate-100 font-marcellus tracking-wide">
                  Internet Required
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pt-1">
                  Kalyani needs an active internet connection to synchronize faculty attendance, period schedules, and live institutional records with Cloud Firestore.
                </p>
              </div>

              {/* Action Banner */}
              <div className="p-3.5 rounded-2xl bg-kalyani-crimson-950/80 border border-kalyani-gold-500/20 text-xs text-kalyani-gold-200/90 text-left flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-kalyani-gold-400 shrink-0 mt-0.5" />
                <span>
                  Please turn on your <strong>Wi-Fi</strong> or <strong>Mobile Data</strong>. This screen will automatically detect when you are back online.
                </span>
              </div>

              {/* Manual Retry Button */}
              <div className="pt-2">
                <KalyaniButton
                  variant="gold"
                  size="md"
                  className="w-full h-12 rounded-2xl font-bold shadow-gold-md flex items-center justify-center gap-2 text-sm tracking-wide"
                  onClick={verifyConnection}
                  isLoading={isChecking}
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />}
                >
                  <span>{isChecking ? 'Checking Connection…' : 'Check Connection Again'}</span>
                </KalyaniButton>
              </div>
            </div>
          ) : (
            /* Reconnected Celebration State (Stays on same screen so user clearly sees connection confirmed) */
            <div className="space-y-5 animate-in zoom-in-95 fade-in duration-300">
              {/* Connected Icon with Emerald Glow */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-800 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  <Wifi className="w-10 h-10 text-emerald-300 animate-bounce" />
                </div>
              </div>

              {/* Connected Announcement */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Internet Connected</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-normal text-gold-gradient font-marcellus tracking-wide">
                  Connection Restored!
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  Institutional cloud synchronization is active. Redirecting you to the portal in <span className="font-bold text-kalyani-gold-300">{redirectCountdown}s</span>…
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-emerald-500/30">
                <div className="bg-gradient-to-r from-emerald-400 to-kalyani-gold-400 h-full w-full animate-in slide-in-from-left duration-2000" />
              </div>
            </div>
          )}
        </KalyaniCard>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-kalyani-gold-300/60 pb-2 tracking-wider">
        <span>Kalyani System Security &amp; Live Cloud Gateway</span>
      </footer>
    </div>
  );
};
