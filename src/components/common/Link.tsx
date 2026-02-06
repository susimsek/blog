import React, { ReactNode, MouseEvent, KeyboardEvent, forwardRef } from 'react';
import NextLink, { LinkProps } from 'next/link';
import { useRouter } from '@/navigation/router';

interface LinkComponentProps extends Omit<LinkProps, 'href'> {
  children: ReactNode;
  href?: string;
  className?: string;
  skipLocaleHandling?: boolean;
  locale?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
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

const LinkComponent = forwardRef<HTMLAnchorElement, LinkComponentProps>(
  ({ children, skipLocaleHandling = false, href, locale, className, onClick, ...rest }, ref) => {
    const router = useRouter();
    const resolvedHref = href ?? router.asPath;
    const currentLocale = locale ?? router.locale ?? router.defaultLocale ?? undefined;

    const external = isExternalUrl(resolvedHref);
    const shouldHandleLocale = !skipLocaleHandling && !external && !!currentLocale;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as MouseEvent<HTMLAnchorElement>);
      }
    };

    const defaultClassName = 'link';
    const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

    const localeAttr = shouldHandleLocale ? (currentLocale ?? '') : 'false';

    return (
      <NextLink
        ref={ref}
        href={resolvedHref}
        className={combinedClassName}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
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
