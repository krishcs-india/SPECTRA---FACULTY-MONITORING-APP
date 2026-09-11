import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, Layers } from 'lucide-react';

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
      className={`fixed inset-0 z-[9999] bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden select-none transition-all duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none scale-105 filter blur-sm' : 'opacity-100 scale-100'
      }`}
    >
      {/* Subtle ambient light gradient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Edition Badge */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top duration-700 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Higher Education Institutional Edition</span>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto my-auto space-y-6">
        {/* Minimalist Tech Emblem */}
        <div className="relative my-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/40 shadow-2xl flex items-center justify-center text-white">
            <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight">S</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-normal tracking-[0.2em] text-white font-marcellus">
            SPECTRA
          </h1>
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">by</span>
            <span className="text-xs sm:text-sm font-semibold tracking-[0.18em] text-slate-200 px-3 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">
              KRISH CS
            </span>
          </div>
          <p className="text-sm sm:text-base font-normal text-slate-300 tracking-wider max-w-md mx-auto pt-1 font-marcellus">
            Scheduling &amp; Period Engagement with Classroom Tracking &amp; Roster Allocation
          </p>
        </div>

        {/* Minimalist Progress Loader */}
        <div className="w-full max-w-xs pt-4 space-y-3">
          <p className="text-xs font-medium text-slate-400 tracking-wide">
            Initializing Schedule &amp; Period Engine…
          </p>
          <div className="flex items-center justify-center gap-2.5 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"
                style={{ animationDelay: `${i * 180}ms`, animationDuration: '1.2s' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Subtitle */}
      <div className="relative z-10 text-center text-[11px] text-slate-500 tracking-wider">
        <span>Faculty Period &amp; Schedule Monitoring System</span>
      </div>
    </div>
  );
};
