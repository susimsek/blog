import { ReactNode, useEffect } from 'react';
import { useAppSelector } from '@/config/store';

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme = useAppSelector(state => state.theme.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  return <>{children}</>;
}
