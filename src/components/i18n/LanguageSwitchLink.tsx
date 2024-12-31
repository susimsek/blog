import { useRouter } from 'next/router';
import languageDetector from '@/lib/languageDetector';
import i18nextConfig from '../../../next-i18next.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { LOCALES } from '@/config/constants';
import FlagIcon from '@/components/common/FlagIcon';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

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

  if (router.query?.q) {
    const queryString = `q=${router.query.q}`;
    currentHref += currentHref.includes('?') ? `&${queryString}` : `?${queryString}`;
  }

  // Click Handler
  const handleClick = () => {
    languageDetector.cache?.(locale);
    router.replace(currentHref);
  };

  return (
    <button
      type="button"
      className="d-flex justify-content-between align-items-center w-100 px-2 border-0 bg-transparent"
      onClick={handleClick}
    >
      <span className="d-flex align-items-center">
        <FlagIcon
          className="me-2"
          code={LOCALES[locale]?.locale || locale}
          alt={`${LOCALES[locale]?.name} flag`}
          style={{ width: 20 }}
        />
        {LOCALES[locale]?.name || locale}
      </span>
      {currentLocale === locale && <FontAwesomeIcon icon="circle-check" className="circle-check" />}
    </button>
  );
};

export default LanguageSwitchLink;
