import React, { useEffect, useState } from 'react';
import { audioService } from '../../services/audioService';
import { MilkyWayCanvas } from './MilkyWayCanvas';
import { Sparkles } from 'lucide-react';

interface KalyaniSplashScreenProps {
  onComplete: () => void;
}

export const KalyaniSplashScreen: React.FC<KalyaniSplashScreenProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    try { audioService.play(); } catch {}
    const startAudioOnGesture = () => { try { audioService.play(); } catch {} };
    window.addEventListener('click', startAudioOnGesture, { once: true });
    window.addEventListener('pointerdown', startAudioOnGesture, { once: true });
    window.addEventListener('keydown', startAudioOnGesture, { once: true });
    return () => {
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('pointerdown', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => { onComplete(); }, 700);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-kalyani-crimson-950 via-[#130105] to-[#050001] flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden select-none transition-all duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none scale-105 filter blur-md' : 'opacity-100 scale-100'
      }`}
    >
      <MilkyWayCanvas />

      <div className="absolute -top-36 -right-36 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] pointer-events-none opacity-20 z-0 select-none">
        <img src="/assets/main-design.png" alt="Mandala Background" draggable={false} className="w-full h-full object-contain animate-spin-slow pointer-events-none select-none" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <div className="absolute -bottom-36 -left-36 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] pointer-events-none opacity-20 z-0 select-none">
        <img src="/assets/main-design.png" alt="Mandala Background" draggable={false} className="w-full h-full object-contain animate-spin-slow [animation-direction:reverse] pointer-events-none select-none" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>

      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-kalyani-gold-500/10 border border-kalyani-gold-400/30 text-kalyani-gold-300 text-xs tracking-widest uppercase font-semibold animate-in fade-in slide-in-from-top duration-700 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
        <Sparkles className="w-3.5 h-3.5 text-kalyani-gold-400 animate-pulse" />
        <span>Higher Education Institutional Edition</span>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto my-auto space-y-6">
        <div className="relative group my-2">
          <div className="absolute -inset-8 bg-gradient-to-r from-kalyani-gold-400/50 via-kalyani-crimson-600/60 to-kalyani-gold-500/50 rounded-[40px] blur-3xl opacity-90 animate-pulse-ring" />
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 rounded-[32px] p-1.5 bg-gradient-to-br from-kalyani-gold-300 via-kalyani-gold-500 to-kalyani-crimson-800 shadow-[0_0_75px_rgba(212,175,55,0.6)] flex items-center justify-center overflow-hidden">
            <img src="/assets/krish-cs-logo.png" alt="Krish CS Logo" draggable={false} className="w-full h-full object-cover rounded-[28px] pointer-events-none select-none" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl font-normal tracking-[0.25em] text-gold-gradient font-marcellus drop-shadow-[0_4px_35px_rgba(212,175,55,0.5)]" style={{ fontFamily: "'Marcellus', serif" }}>
            KALYANI
          </h1>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs uppercase tracking-[0.25em] text-kalyani-gold-300/80 font-medium">by</span>
            <span className="text-sm sm:text-base font-bold tracking-[0.2em] text-gold-gradient font-marcellus px-3.5 py-0.5 rounded-full bg-kalyani-gold-500/15 border border-kalyani-gold-400/45 shadow-[0_0_22px_rgba(212,175,55,0.3)]">KRISH CS</span>
          </div>
          <p className="text-xl sm:text-2xl font-normal font-cursive text-kalyani-gold-200 tracking-wider pt-1">
            Faculty Availability &amp; Period Management
          </p>
        </div>

        <div className="w-full max-w-sm pt-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-kalyani-gold-400 animate-spin-slow" />
            <p className="text-base sm:text-lg font-medium font-marcellus kalyani-shimmer-text tracking-wide">Kalyani is shimmering to glow…</p>
            <Sparkles className="w-4 h-4 text-kalyani-gold-400 animate-spin-slow [animation-direction:reverse]" />
          </div>
          <div className="flex items-center justify-center gap-3.5 py-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative flex items-center justify-center">
                <span className="absolute w-5 h-5 rounded-full bg-kalyani-gold-400/35 blur-xs animate-ping" style={{ animationDuration: '1.8s', animationDelay: `${i * 150}ms` }} />
                <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-kalyani-gold-500 via-amber-100 to-white shadow-[0_0_16px_#FFEBA0] animate-snake-dot" style={{ animationDelay: `${i * 140}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center text-[11px] text-kalyani-gold-300/60 tracking-wider">
        <span>Academic Operations Matrix</span>
      </div>
    </div>
  );
};
