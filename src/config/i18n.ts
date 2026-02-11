import { createInstance } from 'i18next';
import type { InitOptions, i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultLocale, locales } from '@/i18n/settings';
import type { LocaleResources } from '@/i18n/server';

const buildInitOptions = (locale: string, resources: LocaleResources): InitOptions => ({
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

export const createI18nInstance = (locale: string, resources: LocaleResources): I18nInstance => {
  const i18n = createInstance();
  i18n.use(initReactI18next);
  i18n.init(buildInitOptions(locale, resources));
  return i18n;
};
