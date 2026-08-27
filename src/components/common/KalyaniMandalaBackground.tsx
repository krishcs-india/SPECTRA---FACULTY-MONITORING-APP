import React from 'react';

export const KalyaniMandalaBackground: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Deep Atmospheric Gradients */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-kalyani-crimson-800/40 blur-[130px]" />
      <div className="absolute top-1/3 -right-48 w-[700px] h-[700px] rounded-full bg-kalyani-gold-500/10 blur-[160px]" />
      <div className="absolute -bottom-48 left-1/4 w-[650px] h-[650px] rounded-full bg-kalyani-crimson-900/60 blur-[140px]" />

      {/* Swirling Circular Background Art - Primary Top-Right Orbit */}
      <div className="absolute -top-40 -right-40 w-[750px] h-[750px] sm:w-[900px] sm:h-[900px] lg:w-[1100px] lg:h-[1100px] opacity-[0.22] mix-blend-screen pointer-events-none animate-spin-slow">
        <img
          src="/assets/main-design.png"
          alt="Swirling Mandala Art"
          draggable={false}
          className="w-full h-full object-contain filter contrast-125 brightness-110 drop-shadow-[0_0_50px_rgba(212,175,55,0.35)] pointer-events-none select-none"
        />
      </div>

      {/* Subtle Counter-swirl Orbit in bottom left for harmony */}
      <div 
        className="absolute -bottom-64 -left-64 w-[600px] h-[600px] sm:w-[750px] sm:h-[750px] opacity-[0.14] mix-blend-screen pointer-events-none animate-spin-slow"
        style={{ animationDirection: 'reverse', animationDuration: '65s' }}
      >
        <img
          src="/assets/main-design.png"
          alt="Swirling Mandala Art"
          draggable={false}
          className="w-full h-full object-contain filter contrast-125 brightness-105 pointer-events-none select-none"
        />
      </div>

      {/* Vignette Overlay for Crisp Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-kalyani-crimson-950/80 via-transparent to-kalyani-crimson-950/70" />
    </div>
  );
};
