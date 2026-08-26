import React from 'react';

interface KalyaniLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const KalyaniLoader: React.FC<KalyaniLoaderProps> = ({
  text = 'Synchronizing Kalyani records…',
  size = 'md',
  fullScreen = false,
}) => {
  const spinnerSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className={`relative ${spinnerSizes[size]}`}>
        <div className="absolute inset-0 rounded-full border-2 border-kalyani-gold-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-kalyani-gold-400 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-kalyani-gold-500/10 blur-sm animate-pulse" />
      </div>

      {text && (
        <p className="text-xs font-semibold text-kalyani-gold-300 tracking-wider uppercase">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-kalyani-crimson-950/80 backdrop-blur-xl">
        {content}
      </div>
    );
  }

  return content;
};
