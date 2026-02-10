'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import languageDetector from '@/lib/languageDetector';

const resolveLocale = (): string => {
  const detected = languageDetector.detect();

  if (typeof detected === 'string' && isSupportedLocale(detected)) {
    return detected;
  }

  return defaultLocale;
};

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const targetLocale = resolveLocale();
    languageDetector.cache?.(targetLocale);
    router.replace(`/${targetLocale}`);
  }, [router]);

  return <Loading />;
}
