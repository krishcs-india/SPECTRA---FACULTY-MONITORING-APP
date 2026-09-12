import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface KalyaniSplashScreenProps {
  onComplete: () => void;
}

export const KalyaniSplashScreen: React.FC<KalyaniSplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 3.5s smooth duration for refined institutional loading
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => { onComplete(); }, 600);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0F0912] text-slate-100 flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden select-none transition-all duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none scale-105 filter blur-sm' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft Rose Ambient Light Aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-rose-500/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Edition Badge */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top duration-700 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>Higher Education Institutional Edition</span>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto my-auto space-y-6">
        {/* Official SPECTRA Luxury Emblem */}
        <div className="relative my-2 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-rose-600/30 rounded-3xl blur-2xl opacity-70 animate-pulse-slow" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#1A1020] border-2 border-rose-300/40 shadow-[0_0_40px_rgba(244,63,94,0.35)] p-1.5 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/app-icon-spectra-logo.png"
              alt="SPECTRA Logo"
              draggable={false}
              className="w-full h-full object-cover rounded-2xl select-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-normal tracking-[0.2em] text-gold-gradient font-marcellus">
            SPECTRA
          </h1>
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="text-xs uppercase tracking-[0.2em] text-rose-300/80 font-medium">by</span>
            <span className="text-xs sm:text-sm font-semibold tracking-[0.18em] text-rose-200 px-3 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/60">
              KRISH CS
            </span>
          </div>
          <p className="text-xs sm:text-sm font-normal text-rose-200/90 tracking-wider max-w-md mx-auto pt-1 font-marcellus">
            Scheduling &amp; Period Engagement with Classroom Tracking &amp; Roster Allocation
          </p>
        </div>

        {/* Minimalist Progress Loader */}
        <div className="w-full max-w-xs pt-4 space-y-3">
          <p className="text-xs font-medium text-rose-300/80 tracking-wide font-marcellus">
            Initializing Schedule &amp; Period Engine…
          </p>
          <div className="flex items-center justify-center gap-2.5 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ animationDelay: `${i * 180}ms`, animationDuration: '1.2s' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Subtitle */}
      <div className="relative z-10 text-center text-[11px] text-rose-400/60 tracking-wider font-marcellus">
        <span>Faculty Period &amp; Schedule Monitoring System</span>
      </div>
    </div>
  );
};
