import React, { ReactNode, MouseEvent, forwardRef } from 'react';
import NextLink, { LinkProps } from 'next/link';
import { useParams } from 'next/navigation';
import i18nextConfig, { defaultLocale, isSupportedLocale } from '@/i18n/settings';

interface LinkComponentProps extends Omit<LinkProps, 'href' | 'locale'> {
  children: ReactNode;
  href: string;
  className?: string;
  skipLocaleHandling?: boolean;
  locale?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export const isExternalUrl = (href: string) => {
  try {
    const base = globalThis.window ? globalThis.window.location.origin : 'http://localhost';
    const url = new URL(href, base);
    return url.origin !== base;
  } catch {
    return false;
  }
};

export const hasLocalePrefix = (pathname: string) =>
  i18nextConfig.i18n.locales.some(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

export const localizePathname = (pathname: string, locale: string): string => {
  const localePrefix = i18nextConfig.i18n.locales.find(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  const unlocalizedPath = localePrefix ? pathname.slice(localePrefix.length + 1) || '/' : pathname;
  const targetLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  if (targetLocale === defaultLocale) {
    return unlocalizedPath;
  }

  return `/${targetLocale}${unlocalizedPath === '/' ? '' : unlocalizedPath}`;
};

export const localizeHref = (href: string, locale: string): string => {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (href.startsWith('http://') || href.startsWith('https://')) {
    try {
      const url = new URL(href);
      const currentOrigin = globalThis.window?.location.origin;
      if (!currentOrigin || url.origin !== currentOrigin) {
        return href;
      }

      url.pathname = localizePathname(url.pathname, locale);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return href;
    }
  }

  if (href.startsWith('/')) {
    const url = new URL(href, 'http://localhost');
    url.pathname = localizePathname(url.pathname, locale);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return href;
};

const LinkComponent = forwardRef<HTMLAnchorElement, LinkComponentProps>(
  ({ children, skipLocaleHandling = false, href, locale, className, onClick, ...rest }, ref) => {
    const params = useParams<{ locale?: string | string[] }>();
    const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
    const activeLocale = locale ?? routeLocale ?? i18nextConfig.i18n.defaultLocale;
    const external = isExternalUrl(href);
    const shouldHandleLocale = !skipLocaleHandling && !external && !!activeLocale;
    const localizedHref = shouldHandleLocale ? localizeHref(href, activeLocale) : href;

    const defaultClassName = 'link';
    const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

    const localeAttr = shouldHandleLocale ? activeLocale : 'false';

    return (
      <NextLink
        ref={ref}
        href={localizedHref}
        className={combinedClassName}
        onClick={onClick}
        data-locale={localeAttr}
        {...rest}
      >
        {children}
      </NextLink>
    );
  },
);

LinkComponent.displayName = 'LinkComponent';

export default LinkComponent;
