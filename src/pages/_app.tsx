import { AppProps } from 'next/app';
import '../styles/global.scss';
import React, { Suspense } from 'react';
import { loadIcons } from '@/config/iconLoader';
import Layout from '@/components/Layout';
import { Provider } from 'react-redux';
import store from '@/config/store';
import ThemeProvider from '@/components/ThemeProvider';
import { appWithTranslation } from 'next-i18next';

loadIcons();

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </Provider>
  );
};

export default appWithTranslation(MyApp);
