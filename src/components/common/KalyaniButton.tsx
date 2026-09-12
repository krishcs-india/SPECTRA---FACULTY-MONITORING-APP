import React from 'react';
import { Loader2 } from 'lucide-react';

interface KalyaniButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'glass' | 'ruby' | 'teal' | 'ghost' | 'outline-gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const KalyaniButton: React.FC<KalyaniButtonProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 font-semibold',
  };

  const variantStyles = {
    gold: 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white font-bold hover:brightness-105 shadow-sm hover:shadow-rose-500/25 border border-rose-300/40',
    glass: 'kalyani-glass text-slate-800 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-300 hover:border-rose-400/50',
    'outline-gold': 'border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-400 font-semibold',
    ruby: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium hover:brightness-105 shadow-sm border border-rose-400/30',
    teal: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium hover:brightness-105 border border-teal-400/30',
    ghost: 'text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-white hover:bg-rose-50/70 dark:hover:bg-white/5 rounded-xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none apple-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
