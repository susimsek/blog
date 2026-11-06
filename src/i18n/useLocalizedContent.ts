'use client';

import { defaultLocale } from '@/i18n/settings';
import type { Locale, Localized } from '@/i18n/settings';
import { useLocale } from '@/i18n/useLocale';

export const selectLocalizedContent = <T>(content: Localized<T>, locale: Locale): T =>
  content[locale] ?? content[defaultLocale];

export const useLocalizedContent = <T>(content: Localized<T>): T => {
  const locale = useLocale();
  return selectLocalizedContent(content, locale);
};
