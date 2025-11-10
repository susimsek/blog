import { ReactNode, useEffect } from 'react';
import { useAppSelector } from '@/config/store';
import type { Theme } from '@/reducers/theme';

type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_CLASS_MAP: Record<Theme, string | null> = {
  light: null,
  dark: 'dark-theme',
  oceanic: 'oceanic-theme',
};

export default function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme = useAppSelector(state => state.theme.theme);

  useEffect(() => {
    const classesToRemove = Object.values(THEME_CLASS_MAP).filter(Boolean) as string[];
    document.body.classList.remove(...classesToRemove);

    const themeClass = THEME_CLASS_MAP[theme];
    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }, [theme]);

  return <>{children}</>;
}
