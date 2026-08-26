import React from 'react';
import { KalyaniCard } from './KalyaniCard';

interface KalyaniStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'teal' | 'ruby' | 'default';
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
    default: 'bg-kalyani-crimson-800 border-kalyani-gold-500/20 text-kalyani-gold-300',
    gold: 'bg-kalyani-gold-500/10 border-kalyani-gold-500/40 text-kalyani-gold-300 shadow-[0_0_15px_rgba(212,175,55,0.2)]',
    emerald: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    teal: 'bg-teal-950/60 border-teal-500/40 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
    ruby: 'bg-rose-950/60 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  };

  const valueGlowStyles = {
    default: 'text-slate-100',
    gold: 'text-gold-gradient',
    emerald: 'text-emerald-300',
    teal: 'text-teal-300',
    ruby: 'text-rose-300',
  };

  return (
    <KalyaniCard
      onClick={onClick}
      variant="glass"
      className="apple-hover group"
      bodyClassName="p-5 flex items-center justify-between"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl lg:text-3xl font-bold font-sans tracking-tight ${valueGlowStyles[variant]}`}>
            {value}
          </span>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 shrink-0 ${iconGlowStyles[variant]}`}
      >
        {icon}
      </div>
    </KalyaniCard>
  );
};
