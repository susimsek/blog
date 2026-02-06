import React from 'react';
import { useParams } from 'next/navigation';
import i18nextConfig from '@/i18n/settings';

interface DateDisplayProps {
  readonly date: string;
  readonly locale?: string;
  readonly className?: string;
}

export default function DateDisplay({ date, locale, className }: Readonly<DateDisplayProps>) {
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = locale ?? routeLocale ?? i18nextConfig.i18n.defaultLocale;

  return (
    <span className={className}>
      {new Date(date).toLocaleDateString(currentLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </span>
  );
}
