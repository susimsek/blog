import { useRouter } from 'next/router';
import languageDetector from '@/lib/languageDetector';
import i18nextConfig from '../../../next-i18next.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import Flag from 'react-world-flags';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const localeNames: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
};

const flagCodes: Record<string, string> = {
  tr: 'tr',
  en: 'gb',
};

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();
  const currentLocale = router.query.locale || i18nextConfig.i18n.defaultLocale;

  let currentHref = href ?? router.asPath;
  let currentPath = router.pathname;

  Object.keys(router.query).forEach(key => {
    if (key === 'locale') {
      currentPath = currentPath.replace(`[${key}]`, locale);
      return;
    }
    currentPath = currentPath.replace(`[${key}]`, String(router.query[key]));
  });

  if (locale && !href?.startsWith('http')) {
    currentHref = href ? `/${locale}${href}` : currentPath;
  }

  if (!currentHref.startsWith(`/${locale}`) && !href?.startsWith('http')) {
    currentHref = `/${locale}${currentHref}`;
  }

  // Click Handler
  const handleClick = () => {
    languageDetector.cache?.(locale);
    router.push(currentHref);
  };

  return (
    <button
      type="button"
      className="d-flex justify-content-between align-items-center w-100 px-2 border-0 bg-transparent"
      onClick={handleClick}
    >
      <span className="d-flex align-items-center">
        <Flag code={flagCodes[locale] || locale} style={{ width: '20px', marginRight: '8px' }} />
        {localeNames[locale] || locale}
      </span>
      {currentLocale === locale && <FontAwesomeIcon icon="circle-check" className="text-muted" />}
    </button>
  );
};

export default LanguageSwitchLink;
