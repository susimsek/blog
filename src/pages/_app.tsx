import { AppProps } from 'next/app';
import '../styles/global.scss';
import React from 'react';
import { loadIcons } from '@/config/iconLoader';
import { Provider } from 'react-redux';
import store from '@/config/store';
import { appWithTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';

loadIcons();

const ThemeProvider = dynamic(() => import('@/components/theme/ThemeProvider'), { ssr: false });

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
