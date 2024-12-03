import languageDetector from '@/lib/languageDetector';
import { useRouter } from 'next/router';
import React from 'react';
import { Button } from 'react-bootstrap';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();

  let currentHref = href ?? router.asPath;
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
    <Button
      variant="link"
      size="sm"
      className="button-link"
      onClick={() => {
        languageDetector.cache?.(locale);
        router.push(currentHref);
      }}
    >
      {locale.toUpperCase()}
    </Button>
  );
};

export default LanguageSwitchLink;
