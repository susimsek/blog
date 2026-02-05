import { ReactNode, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/config/store';
import type { Theme } from '@/reducers/theme';
import { setThemeFromSystem } from '@/reducers/theme';

type ThemeProviderProps = {
  children: ReactNode;
};

const THEME_CLASS_MAP: Record<Theme, string | null> = {
  light: null,
  dark: 'dark-theme',
  oceanic: 'oceanic-theme',
  forest: 'forest-theme',
};

export default function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const dispatch = useAppDispatch();
  const { theme, hasExplicitTheme } = useAppSelector(state => state.theme);
  const didMountRef = useRef(false);

  useEffect(() => {
    const win = globalThis.window;
    const root = document.documentElement;
    const classesToRemove = Object.values(THEME_CLASS_MAP).filter(Boolean) as string[];
    root.classList.remove(...classesToRemove);

    const themeClass = THEME_CLASS_MAP[theme];
    if (themeClass) {
      root.classList.add(themeClass);
    }

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const prefersReducedMotion =
      typeof win?.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      root.classList.remove('theme-transitioning');
      // Force reflow so re-adding restarts the animation.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      root.offsetHeight;
      root.classList.add('theme-transitioning');
      win?.setTimeout(() => root.classList.remove('theme-transitioning'), 320);
    }
  }, [theme]);

  useEffect(() => {
    const win = globalThis.window;
    if (hasExplicitTheme) return;
    if (typeof win?.matchMedia !== 'function') return;

    const mediaQuery = win.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => dispatch(setThemeFromSystem(mediaQuery.matches ? 'dark' : 'light'));

    apply();
    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, [dispatch, hasExplicitTheme]);

  return <>{children}</>;
}
