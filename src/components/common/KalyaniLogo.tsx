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
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl md:text-5xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs tracking-wider',
    xl: 'text-sm tracking-[0.2em]',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Modern Minimalist SPECTRA Emblem (No image logos or complex graphics) */}
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold font-mono tracking-wider shadow-sm border border-blue-400/30 ${iconSizes[size]}`}
      >
        <span>S</span>
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
            className={`font-medium tracking-wide text-slate-400 dark:text-slate-400 ${subtitleSizes[size]}`}
          >
            Faculty Period &amp; Schedule Management
          </span>
        )}
      </div>
    </div>
  );
};
