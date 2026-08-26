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
    gold: 'bg-gradient-to-r from-kalyani-gold-600 via-kalyani-gold-500 to-kalyani-gold-600 text-kalyani-crimson-950 font-bold hover:brightness-110 shadow-gold-sm hover:shadow-gold-md border border-kalyani-gold-300/40',
    glass: 'kalyani-glass text-slate-100 hover:text-kalyani-gold-200 hover:border-kalyani-gold-500/40 hover:bg-kalyani-crimson-850/80',
    'outline-gold': 'border border-kalyani-gold-500/40 text-kalyani-gold-300 hover:bg-kalyani-gold-500/10 hover:border-kalyani-gold-400',
    ruby: 'bg-gradient-to-r from-kalyani-ruby-700 to-kalyani-ruby-600 text-white font-medium hover:brightness-110 shadow-ruby-sm border border-rose-400/30',
    teal: 'bg-gradient-to-r from-teal-700 to-teal-600 text-white font-medium hover:brightness-110 border border-teal-400/30',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5 rounded-xl',
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
