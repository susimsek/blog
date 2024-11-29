// reducers/theme.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isBrowser } from '@/config/constants';

type ThemeState = {
  theme: 'light' | 'dark';
};

const getInitialTheme = (): 'light' | 'dark' => {
  if (isBrowser) {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
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
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      if (isBrowser) {
        localStorage.setItem('theme', state.theme);
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      if (isBrowser) {
        localStorage.setItem('theme', state.theme);
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
