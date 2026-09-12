import React from 'react';

interface KalyaniCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'glass' | 'elevated' | 'gold' | 'card';
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onClick?: () => void;
}

export const KalyaniCard: React.FC<KalyaniCardProps> = ({
  children,
  title,
  subtitle,
  action,
  variant = 'glass',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  onClick,
}) => {
  const variantStyles = {
    glass: 'kalyani-glass rounded-2xl shadow-apple-card',
    elevated: 'kalyani-glass-elevated rounded-2xl',
    gold: 'kalyani-glass-gold rounded-2xl',
    card: 'kalyani-glass-card rounded-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:border-rose-400/60 hover:shadow-sm hover:brightness-105' : ''
      } ${className}`}
    >
      {/* Top subtle highlight line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />

      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-rose-200/70 dark:border-rose-950/60 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-semibold font-marcellus text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
