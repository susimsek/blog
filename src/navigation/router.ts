'use client';

import { useMemo } from 'react';
import {
  useParams as useNavigationParams,
  usePathname,
  useRouter as useNavigationRouter,
  useSearchParams,
} from 'next/navigation';
import { defaultLocale, locales } from '@/i18n/settings';

export type QueryValue = string | string[] | undefined;
export type Query = Record<string, QueryValue>;

type UrlQueryValue = string | number | boolean | Array<string | number | boolean> | undefined;

type UrlObject = {
  pathname?: string;
  query?: Record<string, UrlQueryValue>;
};

type RouterOptions = {
  shallow?: boolean;
  scroll?: boolean;
};

export type NextRouter = {
  asPath: string;
  pathname: string;
  route: string;
  query: Query;
  paramKeys: string[];
  isReady: boolean;
  locale?: string;
  defaultLocale?: string;
  push: (url: string | UrlObject, as?: string, options?: RouterOptions) => void;
  replace: (url: string | UrlObject, as?: string, options?: RouterOptions) => void;
};

const isLocaleSegment = (value: string | undefined): value is string => {
  return typeof value === 'string' && locales.includes(value);
};

const normalizeQueryEntry = (value: UrlQueryValue): string[] => {
  if (value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [String(value)];
};

const buildHref = (input: string | UrlObject, currentPathname: string, currentQuery: Query): string => {
  if (typeof input === 'string') {
    return input;
  }

  const pathname = input.pathname ?? currentPathname;
  const params = new URLSearchParams();

  const mergedQuery: Record<string, UrlQueryValue> = {
    ...Object.fromEntries(
      Object.entries(currentQuery).map(([key, value]) => [key, Array.isArray(value) ? value : (value ?? undefined)]),
    ),
    ...(input.query ?? {}),
  };

  Object.entries(mergedQuery).forEach(([key, value]) => {
    if (key === 'locale') {
      return;
    }

    normalizeQueryEntry(value).forEach(item => params.append(key, item));
  });

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

export const useRouter = (): NextRouter => {
  const navigationRouter = useNavigationRouter();
  const pathname = usePathname() ?? '/';
  const params = useNavigationParams();
  const searchParams = useSearchParams();

  const pathParams = useMemo<Query>(() => {
    const nextParams: Query = {};

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        nextParams[key] = value.map(item => String(item));
      } else if (value !== undefined) {
        nextParams[key] = String(value);
      }
    });

    return nextParams;
  }, [params]);

  const paramKeys = useMemo(() => Object.keys(pathParams), [pathParams]);

  const query = useMemo<Query>(() => {
    const nextQuery: Query = {};

    Object.entries(pathParams).forEach(([key, value]) => {
      nextQuery[key] = value;
    });

    searchParams.forEach((value, key) => {
      if (nextQuery[key] === undefined) {
        nextQuery[key] = value;
        return;
      }

      const existing = nextQuery[key];
      if (Array.isArray(existing)) {
        nextQuery[key] = [...existing, value];
      } else {
        nextQuery[key] = [existing, value];
      }
    });

    return nextQuery;
  }, [pathParams, searchParams]);

  const localeFromParams = query.locale;
  const locale = Array.isArray(localeFromParams)
    ? localeFromParams[0]
    : isLocaleSegment(localeFromParams)
      ? localeFromParams
      : undefined;

  const asPath = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  return useMemo(
    () => ({
      asPath,
      pathname,
      route: pathname,
      query,
      paramKeys,
      isReady: true,
      locale: locale ?? defaultLocale,
      defaultLocale,
      push: (url, _as, options) => {
        navigationRouter.push(buildHref(url, pathname, query), { scroll: options?.scroll });
      },
      replace: (url, _as, options) => {
        navigationRouter.replace(buildHref(url, pathname, query), { scroll: options?.scroll });
      },
    }),
    [asPath, locale, navigationRouter, pathname, query, paramKeys],
  );
};
