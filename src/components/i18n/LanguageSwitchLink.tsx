import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import languageDetector from '@/lib/languageDetector';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import type { Locale } from '@/i18n/settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo } from 'react';
import { LOCALES } from '@/config/constants';
import FlagIcon from '@/components/common/FlagIcon';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale: Locale = routeLocale && isSupportedLocale(routeLocale) ? routeLocale : defaultLocale;

  const isExternalHref = href?.startsWith('http');

  const sanitizedQuery = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('locale');
    return nextParams.toString();
  }, [searchParams]);

  const buildLocalizedHref = () => {
    if (isExternalHref && href) {
      return href;
    }

    const basePath = (() => {
      if (href) {
        return href.startsWith('/') ? href : `/${href}`;
      }
      const pathOnly = pathname || '/';
      if (!currentLocale) {
        return pathOnly;
      }
      const localePrefix = `/${currentLocale}`;
      if (pathOnly === localePrefix) {
        return '/';
      }
      if (pathOnly.startsWith(`${localePrefix}/`)) {
        return pathOnly.substring(localePrefix.length) || '/';
      }
      return pathOnly;
    })();

    const normalizedPath = basePath === '/' ? '' : basePath;
    const localizedPath = `/${locale}${normalizedPath}`;
    return sanitizedQuery ? `${localizedPath}?${sanitizedQuery}` : localizedPath;
  };

  const currentHref = buildLocalizedHref();
  const localeEntry = isSupportedLocale(locale) ? LOCALES[locale] : null;

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
          code={localeEntry?.locale ?? locale}
          alt={`${localeEntry?.name ?? locale} flag`}
          style={{ width: 20 }}
        />
        {localeEntry?.name ?? locale}
      </span>
      {currentLocale === locale && <FontAwesomeIcon icon="circle-check" className="circle-check" />}
    </button>
  );
};

export default LanguageSwitchLink;
