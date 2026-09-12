import React from 'react';
import { KalyaniCard } from './KalyaniCard';

interface KalyaniEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const KalyaniEmptyState: React.FC<KalyaniEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <KalyaniCard
      variant="glass"
      className={`text-center py-12 px-6 flex flex-col items-center justify-center ${className}`}
    >
      {/* Decorative Icon Watermark */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-500 shadow-sm">
          {icon || (
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="50" cy="50" r="40" strokeDasharray="3 3" />
              <path d="M50 20 C60 35 60 50 50 50 C40 50 40 35 50 20 Z" fill="currentColor" opacity="0.3" />
              <path d="M50 80 C60 65 60 50 50 50 C40 50 40 65 50 80 Z" fill="currentColor" opacity="0.3" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold font-marcellus text-rose-950 dark:text-rose-100">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </KalyaniCard>
  );
};
