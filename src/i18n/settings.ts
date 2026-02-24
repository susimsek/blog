import i18nConfig from '@root/i18n.config.json';
import { LOCALES } from '@/config/constants';

export type Locale = keyof typeof LOCALES;

const localeKeys = Object.keys(LOCALES) as Locale[];
const isKnownLocale = (value: string): value is Locale => localeKeys.includes(value as Locale);

const configuredLocales = i18nConfig.locales.filter(isKnownLocale);
export const locales: Locale[] = configuredLocales.length > 0 ? configuredLocales : localeKeys;

const configuredDefaultLocale = i18nConfig.defaultLocale;
export const defaultLocale: Locale = isKnownLocale(configuredDefaultLocale) ? configuredDefaultLocale : locales[0];

const i18nextConfig = {
  i18n: {
    defaultLocale,
    locales,
  },
} as const;

export const allNamespaces = [
  '404',
  'about',
  'category',
  'common',
  'contact',
  'home',
  'medium',
  'post',
  'search',
  'topic',
];
export const layoutNamespaces = ['404', 'common', 'post', 'topic'] as const;

export const isSupportedLocale = (value: string): value is Locale => locales.includes(value as Locale);

export default i18nextConfig;
