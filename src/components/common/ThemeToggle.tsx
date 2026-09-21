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
      className={`h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl border transition-all duration-200 apple-hover select-none shrink-0 ${
        theme === 'light'
          ? 'bg-rose-50/80 border-rose-200/80 text-rose-700 hover:bg-rose-100 shadow-sm'
          : 'bg-[#180E1C] border-rose-900/60 text-pink-300 hover:bg-[#25172C] hover:text-pink-200 shadow-sm'
      } ${className}`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to White Mode'}
      aria-label="Toggle theme mode"
    >
      {theme === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          {showLabel && <span className="text-xs font-semibold">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-pink-400 shrink-0" />
          {showLabel && <span className="text-xs font-semibold">Dark</span>}
        </>
      )}
    </button>
  );
};
