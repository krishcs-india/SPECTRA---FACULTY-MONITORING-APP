import React from 'react';
import { ScheduleStatus, PeriodEntryType } from '../../types/schedule';

interface KalyaniBadgeProps {
  status?: ScheduleStatus;
  entryType?: PeriodEntryType;
  variant?: 'emerald' | 'teal' | 'ruby' | 'amber' | 'gold' | 'slate';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const KalyaniBadge: React.FC<KalyaniBadgeProps> = ({
  status,
  entryType,
  variant,
  size = 'sm',
  children,
  dot = true,
  className = '',
}) => {
  // If status is supplied, infer style
  let resolvedVariant = variant || 'slate';
  let resolvedText = children;

  if (status) {
    if (status === 'SUBMITTED') {
      resolvedVariant = 'emerald';
      resolvedText = resolvedText || 'Submitted';
    } else if (status === 'FULL_DAY_FREE') {
      resolvedVariant = 'teal';
      resolvedText = resolvedText || 'Full Day Free';
    } else {
      resolvedVariant = 'ruby';
      resolvedText = resolvedText || 'Not Submitted';
    }
  } else if (entryType) {
    if (entryType === 'FREE') {
      resolvedVariant = 'teal';
      resolvedText = resolvedText || 'FREE';
    } else if (entryType === 'SUBJECT') {
      resolvedVariant = 'gold';
      resolvedText = resolvedText || 'Assigned';
    } else if (entryType === 'CUSTOM') {
      resolvedVariant = 'amber';
      resolvedText = resolvedText || 'Custom';
    }
  }

  const variantStyles = {
    emerald: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    teal: 'bg-teal-950/70 border-teal-500/40 text-teal-300',
    ruby: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
    amber: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    gold: 'bg-kalyani-crimson-900 border-kalyani-gold-500/50 text-kalyani-gold-300',
    slate: 'bg-slate-900/70 border-slate-700 text-slate-300',
  };

  const dotStyles = {
    emerald: 'bg-emerald-400',
    teal: 'bg-teal-400',
    ruby: 'bg-rose-400 animate-pulse',
    amber: 'bg-amber-400',
    gold: 'bg-kalyani-gold-400 shadow-[0_0_6px_#D4AF37]',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] font-medium rounded-full gap-1.5',
    md: 'px-3 py-1 text-xs font-semibold rounded-full gap-2',
  };

  return (
    <span
      className={`inline-flex items-center border backdrop-blur-sm select-none ${
        sizeStyles[size]
      } ${variantStyles[resolvedVariant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[resolvedVariant]}`} />
      )}
      <span>{resolvedText}</span>
    </span>
  );
};
