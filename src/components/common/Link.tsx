// components/common/LinkComponent.tsx
import React, { ReactNode, MouseEvent } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';

interface LinkComponentProps extends Omit<LinkProps, 'href'> {
  children: ReactNode;
  href?: string;
  className?: string; // Class name for the anchor element
  skipLocaleHandling?: boolean;
  locale?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void; // onClick handler
}

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

  // Define default class name
  const defaultClassName = 'link';
  const combinedClassName = className ? `${defaultClassName} ${className}` : defaultClassName;

  return (
    <Link href={resolvedHref} {...rest} legacyBehavior>
      <a className={combinedClassName} onClick={handleClick}>
        {children}
      </a>
    </Link>
  );
};

export default LinkComponent;
