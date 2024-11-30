import { useSelector } from 'react-redux';
import { RootState } from '@/config/store';
import { ReactNode, useEffect, useState } from 'react';
import Loading from '@/components/Loading';

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useSelector((state: RootState) => state.theme.theme);
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
