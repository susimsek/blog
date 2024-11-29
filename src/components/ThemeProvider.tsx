import { useSelector } from 'react-redux';
import { RootState } from '@/config/store';
import { ReactNode, useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';

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
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  return <>{children}</>;
}
