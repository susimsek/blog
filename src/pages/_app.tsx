import { AppProps } from 'next/app';
import '../styles/global.scss';
import React from 'react';
import { loadIcons } from '@/config/iconLoader';
import Layout from '@/components/Layout';
import { Provider } from 'react-redux';
import store from '@/config/store';
import ThemeProvider from '@/components/ThemeProvider';

loadIcons();

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </Provider>
  );
};

export default MyApp;
