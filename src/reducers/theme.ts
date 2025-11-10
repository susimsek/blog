// reducers/theme.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isBrowser } from '@/config/constants';

export type Theme = 'light' | 'dark' | 'oceanic';

type ThemeState = {
  theme: Theme;
};

const THEME_STORAGE_KEY = 'theme';
const THEME_ORDER: Theme[] = ['light', 'dark', 'oceanic'];

const getInitialTheme = (): Theme => {
  if (isBrowser) {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && THEME_ORDER.includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
  }
  return 'light';
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: state => {
      const currentIndex = THEME_ORDER.indexOf(state.theme);
      const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
      state.theme = nextTheme;
      if (isBrowser) {
        localStorage.setItem(THEME_STORAGE_KEY, state.theme);
      }
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      if (isBrowser) {
        localStorage.setItem(THEME_STORAGE_KEY, state.theme);
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
