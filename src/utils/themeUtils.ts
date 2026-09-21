export type ThemeMode = 'dark' | 'light';

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  // Check if the user has explicitly selected a theme preference
  const savedPref = localStorage.getItem('spectra-theme-preference') as ThemeMode;
  if (savedPref === 'dark' || savedPref === 'light') return savedPref;

  // Legacy key check: only honor if explicitly set to 'light' or 'dark' by active user toggle
  const legacy = localStorage.getItem('spectra-theme') as ThemeMode;
  if (legacy === 'dark' || legacy === 'light') return legacy;

  // By default, the application is in white / light mode
  return 'light';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  localStorage.setItem('spectra-theme-preference', theme);
  localStorage.setItem('spectra-theme', theme);
};

export const toggleThemeMode = (): ThemeMode => {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
