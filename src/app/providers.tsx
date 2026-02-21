'use client';

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/config/store';
import ThemeProvider from '@/components/theme/ThemeProvider';
import I18nProvider from '@/i18n/provider';
import type { LocaleResources } from '@/i18n/server';
import { loadIcons } from '@/config/iconLoader';
import AppErrorToasts from '@/components/common/AppErrorToasts';

loadIcons();

type AppProvidersProps = {
  locale: string;
  resources: LocaleResources;
  children: React.ReactNode;
};

export default function AppProviders({ locale, resources, children }: Readonly<AppProvidersProps>) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <I18nProvider locale={locale} resources={resources}>
        <ThemeProvider>
          {children}
          <AppErrorToasts />
        </ThemeProvider>
      </I18nProvider>
    </Provider>
  );
}
