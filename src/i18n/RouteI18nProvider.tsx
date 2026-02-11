'use client';

import React, { useMemo } from 'react';
import type { i18n as I18nInstance } from 'i18next';
import { I18nContext, I18nextProvider } from 'react-i18next';
import { createI18nInstance } from '@/config/i18n';
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

    return createI18nInstance(locale, resources);
  }, [locale, parentI18n, resources]);

  return <I18nextProvider i18n={scopedI18n}>{children}</I18nextProvider>;
}
