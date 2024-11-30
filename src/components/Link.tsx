import React, { ReactNode } from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';

interface LinkComponentProps extends Omit<LinkProps, 'href'> {
  children: ReactNode;
  href?: string;
  skipLocaleHandling?: boolean;
  locale?: string;
}

const LinkComponent: React.FC<LinkComponentProps> = ({
  children,
  skipLocaleHandling = false,
  href,
  locale,
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

  return (
    <Link href={resolvedHref} {...rest} legacyBehavior>
      <a>{children}</a>
    </Link>
  );
};

export default LinkComponent;
