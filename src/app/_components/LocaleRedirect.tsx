'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';
import languageDetector from '@/lib/languageDetector';
import { defaultLocale } from '@/i18n/settings';

type LocaleRedirectProps = {
  path: string;
};

const resolveLocale = () => {
  const detected = languageDetector.detect();
  return typeof detected === 'string' && detected.length > 0 ? detected : defaultLocale;
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
