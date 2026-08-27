import React from 'react';

interface KalyaniLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const KalyaniLogo: React.FC<KalyaniLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-6xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs tracking-widest',
    xl: 'text-sm tracking-[0.25em]',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Kalyani App Icon from Assets (Clean, No Glow) */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <img
          src="/assets/app-icon-logo.png"
          alt="Kalyani Logo"
          draggable={false}
          className="w-full h-full object-contain rounded-full pointer-events-none select-none"
          onError={(e) => {
            // Fallback to stylized golden K if image path is unavailable
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-marcellus font-normal tracking-wide text-gold-gradient ${titleSizes[size]}`}
            style={{
              fontFamily: "'Marcellus', serif",
              letterSpacing: '0.06em'
            }}
          >
            Kalyani
          </span>

          {/* Swirling Top Text Logo Emblem (/assets/top-text-logo.png) */}
          <div className="relative inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 shrink-0 animate-logo-swirl ml-1">
            {/* Subtle gold glow behind the swirling emblem */}
            <span className="absolute inset-[-1px] rounded-full bg-kalyani-gold-400/15 blur-[2px] shadow-[0_0_5px_rgba(212,175,55,0.35)]" />
            <img
              src="/assets/top-text-logo.png"
              alt="Kalyani Top Logo"
              draggable={false}
              className="relative w-full h-full object-contain rounded-full drop-shadow-[0_0_3px_rgba(212,175,55,0.45)] pointer-events-none select-none"
            />
          </div>
        </div>

        {showSubtitle && (
          <span
            className={`font-normal tracking-wider text-kalyani-gold-300/90 font-marcellus ${subtitleSizes[size]}`}
          >
            Faculty Availability &amp; Period Management
          </span>
        )}
      </div>
    </div>
  );
};
