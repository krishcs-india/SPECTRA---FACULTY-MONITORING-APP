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
    emerald: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300',
    teal: 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-300',
    ruby: 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300',
    amber: 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300',
    gold: 'bg-pink-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200',
    slate: 'bg-slate-100 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  };

  const dotStyles = {
    emerald: 'bg-emerald-500 dark:bg-emerald-400',
    teal: 'bg-teal-500 dark:bg-teal-400',
    ruby: 'bg-rose-500 dark:bg-rose-400 animate-pulse',
    amber: 'bg-amber-500 dark:bg-amber-400',
    gold: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
    slate: 'bg-slate-500 dark:bg-slate-400',
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
