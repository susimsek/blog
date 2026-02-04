// reducers/theme.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isBrowser } from '@/config/constants';
import type { ThemeKey } from '@/config/constants';

export type Theme = ThemeKey;

export type ThemeState = {
  theme: Theme;
  hasExplicitTheme: boolean;
};

const THEME_STORAGE_KEY = 'theme';
const THEME_ORDER: Theme[] = ['light', 'dark', 'oceanic', 'forest'];

const resolveSystemTheme = (): Theme => {
  if (!isBrowser || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialState = (): ThemeState => {
  if (isBrowser) {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && THEME_ORDER.includes(storedTheme as Theme)) {
        return { theme: storedTheme as Theme, hasExplicitTheme: true };
      }
    } catch {
      // Ignore storage errors (private mode / blocked storage).
    }
  }

  return { theme: resolveSystemTheme(), hasExplicitTheme: false };
};

const initialState: ThemeState = getInitialState();

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: state => {
      const currentIndex = THEME_ORDER.indexOf(state.theme);
      const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
      state.theme = nextTheme;
      state.hasExplicitTheme = true;
      if (isBrowser) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, state.theme);
        } catch {
          // Ignore storage errors.
        }
      }
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      state.hasExplicitTheme = true;
      if (isBrowser) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, state.theme);
        } catch {
          // Ignore storage errors.
        }
      }
    },
    setThemeFromSystem: (state, action: PayloadAction<Theme>) => {
      if (state.hasExplicitTheme) return;
      state.theme = action.payload;
    },
    resetToSystemTheme: state => {
      state.hasExplicitTheme = false;
      state.theme = resolveSystemTheme();
      if (isBrowser) {
        try {
          localStorage.removeItem(THEME_STORAGE_KEY);
        } catch {
          // Ignore storage errors.
        }
      }
    },
  },
});

export const { toggleTheme, setTheme, setThemeFromSystem, resetToSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
