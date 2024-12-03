import { ReactNode, useEffect, useState } from 'react';
import Loading from '@/components/common/Loading';
import { useAppSelector } from '@/config/store';

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: Readonly<ThemeProviderProps>) {
  const theme = useAppSelector(state => state.theme.theme);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    document.body.className = theme;
  }, [theme]);

  if (!isClient) {
    return <Loading />;
  }

  return <>{children}</>;
}
