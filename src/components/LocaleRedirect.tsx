'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/common/Loading';
import languageDetector from '@/lib/languageDetector';
import { defaultLocale } from '@/i18n/settings';

type LocaleRedirectProps = {
  path: string;
};

type RedirectProps = {
  to?: string;
};

const resolveLocale = () => {
  const detected = languageDetector.detect();
  return typeof detected === 'string' && detected.trim().length > 0 ? detected : defaultLocale;
};

const normalizeTarget = (target: string, locale: string) => {
  const normalized = target.startsWith('/') ? target : `/${target}`;
  return normalized.startsWith(`/${locale}/`) || normalized === `/${locale}` ? normalized : `/${locale}${normalized}`;
};

export const useRedirect = (to?: string) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchSuffix = useMemo(() => {
    if (!to && searchParams) {
      const query = searchParams.toString();
      return query ? `?${query}` : '';
    }
    return '';
  }, [searchParams, to]);

  useEffect(() => {
    const locale = resolveLocale();
    const rawTarget = to ?? pathname ?? '/';
    const target = normalizeTarget(`${rawTarget}${searchSuffix}`, locale);

    languageDetector.cache?.(locale);
    router.replace(target);
  }, [pathname, router, searchSuffix, to]);
};

export function Redirect({ to }: Readonly<RedirectProps>) {
  useRedirect(to);
  return <Loading />;
}

export const getRedirect = (to: string) => {
  return function RedirectTo() {
    return <Redirect to={to} />;
  };
};

export default function LocaleRedirect({ path }: Readonly<LocaleRedirectProps>) {
  return <Redirect to={path} />;
}
