import React, { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';

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
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(href, base);
    return url.origin !== base;
  } catch {
    return false;
  }
};

const LinkComponent: React.FC<LinkComponentProps> = ({
  children,
  skipLocaleHandling = false,
  href,
  locale,
  className,
  onClick,
  ...rest
}) => {
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

  return (
    <Link
      href={resolvedHref}
      locale={shouldHandleLocale ? currentLocale : false}
      className={combinedClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default LinkComponent;
