'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';
import languageDetector from '@/lib/languageDetector';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';

type LocaleRedirectProps = {
  path: string;
};

const resolveLocale = () => {
  const detected = languageDetector.detect();
  return typeof detected === 'string' && isSupportedLocale(detected) ? detected : defaultLocale;
};

export default function LocaleRedirect({ path }: Readonly<LocaleRedirectProps>) {
  const router = useRouter();

  useEffect(() => {
    const locale = resolveLocale();
    languageDetector.cache?.(locale);
    router.replace(`/${locale}${path}`);
  }, [path, router]);

  return <Loading />;
}
