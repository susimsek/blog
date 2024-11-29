import { AppProps } from 'next/app';
import '../styles/global.scss';
import React, { useState, useEffect } from 'react';
import { loadIcons } from '@/config/iconLoader';
import Layout from '@/components/Layout';
import { Container, Spinner } from 'react-bootstrap';

loadIcons();

const MyApp = ({ Component, pageProps }: AppProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Layout>
      {isClient ? (
        <Component {...pageProps} />
      ) : (
        <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Spinner animation="border" role="status" />
        </Container>
      )}
    </Layout>
  );
};

export default MyApp;
