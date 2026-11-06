import React from 'react';
import { useLocale } from '@/i18n/useLocale';

interface DateDisplayProps {
  readonly date: string;
  readonly locale?: string;
  readonly className?: string;
}

export default function DateDisplay({ date, locale, className }: Readonly<DateDisplayProps>) {
  const preferredLocale = useLocale();
  const currentLocale = locale ?? preferredLocale;

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
