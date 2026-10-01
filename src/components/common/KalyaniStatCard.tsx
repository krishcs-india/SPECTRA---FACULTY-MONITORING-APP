import React from 'react';
import { KalyaniCard } from './KalyaniCard';

interface KalyaniStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'teal' | 'ruby' | 'amber' | 'slate' | 'default';
  onClick?: () => void;
}

export const KalyaniStatCard: React.FC<KalyaniStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  onClick,
}) => {
  const iconGlowStyles = {
    default: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300',
    gold: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 shadow-sm',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
    teal: 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-500/40 text-teal-700 dark:text-teal-400',
    ruby: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-400',
    amber: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400',
    slate: 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400',
  };

  const valueGlowStyles = {
    default: 'text-slate-900 dark:text-slate-100',
    gold: 'text-rose-600 dark:text-rose-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    teal: 'text-teal-600 dark:text-teal-400',
    ruby: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
    slate: 'text-slate-600 dark:text-slate-300',
  };

  return (
    <KalyaniCard
      onClick={onClick}
      variant="glass"
      className="apple-hover group h-full"
      bodyClassName="p-3.5 sm:p-4.5 flex flex-col justify-between h-full"
    >
      {/* 1. Header Row: Uniform Fixed Height Title for Perfect Linear Consistency */}
      <div className="h-8 sm:h-9 flex items-center">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-sans leading-tight line-clamp-2">
          {title}
        </p>
      </div>

      {/* 2. Middle Row: Value & Icon Perfectly Aligned at Identical Vertical Position */}
      <div className="flex items-center justify-between gap-2 my-2">
        <span
          className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight ${valueGlowStyles[variant]}`}
        >
          {value}
        </span>

        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shrink-0 ${iconGlowStyles[variant]}`}
        >
          {icon}
        </div>
      </div>

      {/* 3. Footer Row: Subtitle with Fixed Uniform Height */}
      <div className="h-7 sm:h-8 flex items-start">
        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-tight line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
    </KalyaniCard>
  );
};
