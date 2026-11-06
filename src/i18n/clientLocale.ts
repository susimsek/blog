import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import type { Locale } from '@/i18n/settings';

export const resolveDocumentLocale = (): Locale => {
  if (typeof document === 'undefined') {
    return defaultLocale;
  }

  const locale = document.documentElement.lang.split('-')[0]?.toLowerCase();
  return isSupportedLocale(locale) ? locale : defaultLocale;
};
