import { useRouter } from 'next/router';
import languageDetector from '@/lib/languageDetector';
import i18nextConfig from '../../../next-i18next.config';
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
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const isExternalHref = href?.startsWith('http');

  const dynamicKeys = useMemo(() => {
    const matches = router.pathname.match(/\[\.{3}.+?]|\.{3}\[.+?]|\[.+?]/g) ?? [];
    return new Set(
      matches.map(segment =>
        segment
          .replace(/^\[\.\.\./, '')
          .replace(/\[|\]/g, '')
          .replace(/\.{3}/g, ''),
      ),
    );
  }, [router.pathname]);

  const sanitizedQuery = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(router.query).forEach(([key, value]) => {
      if (key === 'locale' || typeof value === 'undefined' || dynamicKeys.has(key)) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else {
        params.append(key, value);
      }
    });
    return params.toString();
  }, [router.query, dynamicKeys]);

  const replaceDynamicSegments = (path: string) => {
    let resolvedPath = path;
    Object.entries(router.query).forEach(([key, value]) => {
      if (!dynamicKeys.has(key) || typeof value === 'undefined') {
        return;
      }
      const normalizedValue = Array.isArray(value) ? value.join('/') : value;
      const pattern = new RegExp(`\\[\\.{3}${key}\\]|\\[${key}\\]`, 'g');
      resolvedPath = resolvedPath.replace(pattern, normalizedValue);
    });
    return resolvedPath;
  };

  const buildLocalizedHref = () => {
    if (isExternalHref && href) {
      return href;
    }

    const basePath = (() => {
      if (href) {
        return href.startsWith('/') ? href : `/${href}`;
      }
      const pathWithParams = replaceDynamicSegments(router.pathname);
      const [pathOnly] = (pathWithParams || router.asPath || '/').split('?');
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
