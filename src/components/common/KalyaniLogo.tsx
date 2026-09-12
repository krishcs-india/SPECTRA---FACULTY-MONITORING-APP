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
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
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
    lg: 'text-xs tracking-wider',
    xl: 'text-sm tracking-[0.2em]',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official SPECTRA Luxury Emblem */}
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-0.5 ${iconSizes[size]}`}
      >
        <img
          src="/assets/app-icon-spectra-logo.png"
          alt="SPECTRA Logo"
          draggable={false}
          className="w-full h-full object-contain rounded-xl select-none"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-marcellus font-semibold tracking-wider text-gold-gradient ${titleSizes[size]}`}
            style={{ letterSpacing: '0.08em' }}
          >
            SPECTRA
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-medium tracking-wide text-rose-700/80 dark:text-rose-300/80 font-marcellus ${subtitleSizes[size]}`}
          >
            Faculty Period &amp; Schedule Management
          </span>
        )}
      </div>
    </div>
  );
};
