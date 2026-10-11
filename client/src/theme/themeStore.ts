import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  clockFormat: '12h' | '24h';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleClockFormat: () => void;
  setClockFormat: (format: '12h' | '24h') => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('mindora_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  // Default to dark "Deep Space" or system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialClockFormat = (): '12h' | '24h' => {
  if (typeof window === 'undefined') return '12h';
  const saved = localStorage.getItem('mindora_clock_format');
  return saved === '24h' ? '24h' : '12h';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  if (typeof document !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    theme: initialTheme,
    clockFormat: getInitialClockFormat(),

    toggleTheme: () => {
      const nextTheme = get().theme === 'light' ? 'dark' : 'light';
      get().setTheme(nextTheme);
    },

    setTheme: (theme: 'light' | 'dark') => {
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      localStorage.setItem('mindora_theme', theme);
      set({ theme });
    },

    toggleClockFormat: () => {
      const next = get().clockFormat === '12h' ? '24h' : '12h';
      get().setClockFormat(next);
    },

    setClockFormat: (format: '12h' | '24h') => {
      localStorage.setItem('mindora_clock_format', format);
      set({ clockFormat: format });
    },
  };
});

