import React from 'react';

interface KalyaniInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const KalyaniInput = React.forwardRef<HTMLInputElement, KalyaniInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-kalyani-gold-200 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full bg-kalyani-crimson-950/80 border text-slate-100 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all duration-200 placeholder:text-slate-500 backdrop-blur-md ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                : 'border-kalyani-gold-500/20 focus:border-kalyani-gold-400 focus:ring-2 focus:ring-kalyani-gold-500/20'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

KalyaniInput.displayName = 'KalyaniInput';
