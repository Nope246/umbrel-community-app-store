const THEME_KEY = 'bitaxe-monitor-theme';
const DEFAULT_THEME = 'light';

export const getTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(THEME_KEY);
    return saved || DEFAULT_THEME;
  }
  return DEFAULT_THEME;
};

export const setTheme = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, theme);
  }
};

export const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High Contrast' }
];
