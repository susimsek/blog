const i18nextConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
  },
} as const;

export const defaultLocale = i18nextConfig.i18n.defaultLocale;
export const locales = [...i18nextConfig.i18n.locales] as string[];
export const allNamespaces = ['404', 'about', 'common', 'contact', 'home', 'medium', 'post', 'search', 'topic'];

export const isSupportedLocale = (value: string): boolean => locales.includes(value);

export default i18nextConfig;
