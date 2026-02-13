import React, { ReactNode, MouseEvent, forwardRef } from 'react';
import NextLink, { LinkProps } from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import i18nextConfig from '@/i18n/settings';

interface LinkComponentProps extends Omit<LinkProps, 'href'> {
  children: ReactNode;
  href?: string;
  className?: string;
  skipLocaleHandling?: boolean;
  locale?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const isExternalUrl = (href: string) => {
  try {
    const base = globalThis.window ? globalThis.window.location.origin : 'http://localhost';
    const url = new URL(href, base);
    return url.origin !== base;
  } catch {
    return false;
  }
};

const hasLocalePrefix = (pathname: string) =>
  i18nextConfig.i18n.locales.some(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

const localizePathname = (pathname: string, locale: string): string => {
  if (hasLocalePrefix(pathname) || pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
    return pathname;
  }
  if (pathname === '/') {
    return `/${locale}`;
  }
  return `/${locale}${pathname}`;
};

const localizeHref = (href: string, locale: string): string => {
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  if (href.startsWith('http://') || href.startsWith('https://')) {
    try {
      const base = globalThis.window ? globalThis.window.location.origin : 'http://localhost';
      const url = new URL(href, base);
      const localizedPath = localizePathname(url.pathname || '/', locale);
      return `${localizedPath}${url.search}${url.hash}`;
    } catch {
      return href;
    }
  }

  if (href.startsWith('/')) {
    const [pathWithoutHash, hash = ''] = href.split('#');
    const [pathname = '/', query = ''] = pathWithoutHash.split('?');
    const localizedPath = localizePathname(pathname || '/', locale);
    const queryPart = query ? `?${query}` : '';
    const hashPart = hash ? `#${hash}` : '';
    return `${localizedPath}${queryPart}${hashPart}`;
  }

  return href;
};

const LinkComponent = forwardRef<HTMLAnchorElement, LinkComponentProps>(
  ({ children, skipLocaleHandling = false, href, locale, className, onClick, ...rest }, ref) => {
    const params = useParams<{ locale?: string | string[] }>();
    const pathname = usePathname() ?? '/';
    const searchParams = useSearchParams();
    const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
    const activeLocale = locale ?? routeLocale ?? i18nextConfig.i18n.defaultLocale;
    const currentPathWithQuery = (() => {
      const query = searchParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    })();
    const resolvedHref = href ?? currentPathWithQuery;

    const external = isExternalUrl(resolvedHref);
    const shouldHandleLocale = !skipLocaleHandling && !external && !!activeLocale;
    const localizedHref = shouldHandleLocale ? localizeHref(resolvedHref, activeLocale) : resolvedHref;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
    };

    const defaultClassName = 'link';
    const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

    const localeAttr = shouldHandleLocale ? activeLocale : 'false';

    return (
      <NextLink
        ref={ref}
        href={localizedHref}
        className={combinedClassName}
        onClick={handleClick}
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
