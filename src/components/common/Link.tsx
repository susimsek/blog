// Ignore SonarQube rule typescript:S6852 for this block
// sonar-ignore-start

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

// Disable SonarQube rule typescript:S6852 for this class
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
  const currentLocale = locale || (router.query.locale as string) || '';

  let resolvedHref = href || router.asPath;

  if (resolvedHref.startsWith('http')) {
    skipLocaleHandling = true;
  }

  if (currentLocale && !skipLocaleHandling) {
    resolvedHref = resolvedHref
      ? `/${currentLocale}${resolvedHref}`
      : router.pathname.replace('[locale]', currentLocale);
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(event);
    }
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
    <Link href={resolvedHref} {...rest} legacyBehavior>
      <a className={combinedClassName} onClick={handleClick} onKeyDown={handleKeyDown}>
        {children}
      </a>
    </Link>
  );
};

// sonar-ignore-end

export default LinkComponent;
