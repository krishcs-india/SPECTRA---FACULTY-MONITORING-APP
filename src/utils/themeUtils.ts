export type ThemeMode = 'dark' | 'light';

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('spectra-theme') as ThemeMode;
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
  localStorage.setItem('spectra-theme', theme);
};

export const toggleThemeMode = (): ThemeMode => {
  const current = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  const next: ThemeMode = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
};
