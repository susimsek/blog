'use client';

import { useParams } from 'next/navigation';
import LocaleNotFoundPage from '@/views/LocaleNotFoundPage';
import { defaultLocale } from '@/i18n/settings';

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : defaultLocale;

  return <LocaleNotFoundPage locale={locale} />;
}
