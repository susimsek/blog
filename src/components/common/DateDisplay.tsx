import React from 'react';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';

interface DateDisplayProps {
  readonly date: string;
  readonly locale?: string;
  readonly className?: string;
}

export default function DateDisplay({ date, locale, className }: Readonly<DateDisplayProps>) {
  const router = useRouter();
  const currentLocale = locale ?? (router.query.locale as string) ?? i18nextConfig.i18n.defaultLocale;

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
