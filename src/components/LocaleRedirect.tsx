'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/common/Loading';
import languageDetector from '@/lib/languageDetector';
import { defaultLocale, isSupportedLocale, locales } from '@/i18n/settings';

type LocaleRedirectProps = {
  path: string;
};

type RedirectProps = {
  to?: string;
};

const resolveLocale = () => {
  const detected = languageDetector.detect();
  return typeof detected === 'string' && isSupportedLocale(detected) ? detected : defaultLocale;
};

const getNormalizedBasePath = () =>
  (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replaceAll(/^\/+/g, '').replaceAll(/\/+$/g, '');

const splitHref = (target: string) => {
  const normalizedTarget = target.startsWith('/') ? target : `/${target}`;
  const [pathAndQuery, hash = ''] = normalizedTarget.split('#');
  const [pathname = '/', query = ''] = pathAndQuery.split('?');

  return {
    pathname: pathname || '/',
    query: query ? `?${query}` : '',
    hash: hash ? `#${hash}` : '',
  };
};

const stripBasePathFromPathname = (pathname: string) => {
  const basePath = getNormalizedBasePath();
  if (!basePath) {
    return pathname;
  }

  const basePrefix = `/${basePath}`;
  if (pathname === basePrefix) {
    return '/';
  }
  if (pathname.startsWith(`${basePrefix}/`)) {
    return pathname.slice(basePrefix.length) || '/';
  }

  return pathname;
};

const hasLocalePrefix = (pathname: string) => {
  return locales.some(
    supportedLocale => pathname === `/${supportedLocale}` || pathname.startsWith(`/${supportedLocale}/`),
  );
};

const normalizeTarget = (target: string, locale: string) => {
  const { pathname, query, hash } = splitHref(target);
  const basePathAwarePath = stripBasePathFromPathname(pathname);
  let localizedPath = basePathAwarePath;

  if (!hasLocalePrefix(basePathAwarePath)) {
    if (basePathAwarePath === '/') {
      localizedPath = `/${locale}`;
    } else {
      localizedPath = `/${locale}${basePathAwarePath}`;
    }
  }

  return `${localizedPath}${query}${hash}`;
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
