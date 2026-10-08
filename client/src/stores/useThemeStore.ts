import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
    }
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode;
      const initial = saved || 'dark';
      get().setTheme(initial);
    }
  }
}));
