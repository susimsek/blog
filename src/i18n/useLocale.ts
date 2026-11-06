'use client';

import { useParams } from 'next/navigation';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import type { Locale } from '@/i18n/settings';

export const useLocale = (): Locale => {
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  return routeLocale && isSupportedLocale(routeLocale) ? routeLocale : defaultLocale;
};
