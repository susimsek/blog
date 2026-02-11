'use client';

import React, { useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18nInstance } from '@/config/i18n';
import type { LocaleResources } from '@/i18n/server';

type I18nProviderProps = {
  locale: string;
  resources: LocaleResources;
  children: React.ReactNode;
};

export default function I18nProvider({ locale, resources, children }: Readonly<I18nProviderProps>) {
  const i18n = useMemo(() => createI18nInstance(locale, resources), [locale, resources]);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
