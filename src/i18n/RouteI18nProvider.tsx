'use client';

import React, { useMemo } from 'react';
import { createInstance } from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { I18nContext, I18nextProvider, initReactI18next } from 'react-i18next';
import { defaultLocale, locales } from '@/i18n/settings';
import type { LocaleResources } from '@/i18n/server';

type RouteI18nProviderProps = {
  locale: string;
  resources: LocaleResources;
  children: React.ReactNode;
};

const mergeResources = (locale: string, resources: LocaleResources, target: I18nInstance) => {
  Object.entries(resources).forEach(([namespace, resource]) => {
    target.addResourceBundle(locale, namespace, resource, true, true);
  });
};

export default function RouteI18nProvider({ locale, resources, children }: Readonly<RouteI18nProviderProps>) {
  const context = React.useContext(I18nContext);
  const parentI18n = context?.i18n;

  const scopedI18n = useMemo(() => {
    if (parentI18n) {
      const cloned = parentI18n.cloneInstance();
      mergeResources(locale, resources, cloned);
      return cloned;
    }

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
  }, [locale, parentI18n, resources]);

  return <I18nextProvider i18n={scopedI18n}>{children}</I18nextProvider>;
}
