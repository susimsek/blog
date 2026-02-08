'use client';

import React, { useMemo } from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { defaultLocale, locales } from '@/i18n/settings';
import type { LocaleResources } from '@/i18n/server';

type I18nProviderProps = {
  locale: string;
  resources: LocaleResources;
  children: React.ReactNode;
};

function createClientI18n(locale: string, resources: LocaleResources) {
  const i18n = createInstance();

  i18n.use(initReactI18next);
  i18n.init({
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    defaultNS: 'common',
    ns: Object.keys(resources),
    resources: {
      [locale]: resources,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    initAsync: false,
  });

  return i18n;
}

export default function I18nProvider({ locale, resources, children }: Readonly<I18nProviderProps>) {
  const i18n = useMemo(() => createClientI18n(locale, resources), [locale, resources]);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
