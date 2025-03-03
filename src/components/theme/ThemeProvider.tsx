'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useEffect } from 'react';
import { useAppSelector } from '@/config/store';

type ThemeProviderProps = {
  children: ReactNode;
};

function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme = useAppSelector(state => state.theme.theme);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return <>{children}</>;
}

export default dynamic(() => Promise.resolve(ThemeProvider), { ssr: false });
