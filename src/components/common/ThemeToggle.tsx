import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getInitialTheme, toggleThemeMode, ThemeMode } from '../../utils/themeUtils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
  }, []);

  const handleToggle = () => {
    const next = toggleThemeMode();
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 apple-hover select-none ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
      } ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to White Mode'}
      aria-label="Toggle theme mode"
    >
      {theme === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          {showLabel && <span className="text-xs font-medium">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-blue-400" />
          {showLabel && <span className="text-xs font-medium">Dark</span>}
        </>
      )}
    </button>
  );
};
