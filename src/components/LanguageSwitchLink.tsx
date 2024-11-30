import languageDetector from '../lib/languageDetector';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from 'react-bootstrap';
import React from 'react';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href, ...rest }) => {
  const router = useRouter();

  let currentHref = href || router.asPath;
  let currentPath = router.pathname;

  Object.keys(router.query).forEach(key => {
    if (key === 'locale') {
      currentPath = currentPath.replace(`[${key}]`, locale);
      return;
    }
    currentPath = currentPath.replace(`[${key}]`, String(router.query[key]));
  });

  if (locale) {
    currentHref = href ? `/${locale}${href}` : currentPath;
  }
  if (!currentHref.startsWith(`/${locale}`)) {
    currentHref = `/${locale}${currentHref}`;
  }

  return (
    <Link href={currentHref} passHref legacyBehavior>
      <Button
        {...rest}
        variant="link"
        size="sm"
        className="button-link"
        onClick={() => languageDetector.cache?.(locale)}
      >
        {locale.toUpperCase()}
      </Button>
    </Link>
  );
};

export default LanguageSwitchLink;
