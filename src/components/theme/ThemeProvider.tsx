'use client';

import { ReactNode, useEffect } from 'react';
import { useAppSelector } from '@/config/store';

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme = useAppSelector(state => state.theme.theme);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return <>{children}</>;
}
