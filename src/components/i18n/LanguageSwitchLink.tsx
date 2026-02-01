import { useRouter } from 'next/router';
import languageDetector from '@/lib/languageDetector';
import i18nextConfig from '@root/next-i18next.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useMemo } from 'react';
import { LOCALES } from '@/config/constants';
import FlagIcon from '@/components/common/FlagIcon';

interface LanguageSwitchLinkProps {
  locale: string;
  href?: string;
}

const extractDynamicKeys = (pathname: string): Set<string> => {
  const keys = new Set<string>();
  for (let i = 0; i < pathname.length; i += 1) {
    if (pathname[i] !== '[') {
      continue;
    }
    let j = i + 1;
    let buffer = '';
    while (j < pathname.length && pathname[j] !== ']') {
      buffer += pathname[j];
      j += 1;
    }
    if (!buffer) {
      i = j;
      continue;
    }
    const normalized = buffer.startsWith('...') ? buffer.slice(3) : buffer;
    keys.add(normalized);
    i = j;
  }
  return keys;
};

const replaceDynamicSegments = (
  path: string,
  query: Record<string, string | string[] | undefined>,
  dynamicKeys: Set<string>,
) => {
  let resolvedPath = path;
  dynamicKeys.forEach(key => {
    if (!(key in query)) {
      return;
    }
    const value = query[key];
    if (typeof value === 'undefined') {
      return;
    }
    const normalizedValue = Array.isArray(value) ? value.join('/') : value;
    resolvedPath = resolvedPath.split(`[...${key}]`).join(normalizedValue).split(`[${key}]`).join(normalizedValue);
  });
  return resolvedPath;
};

const LanguageSwitchLink: React.FC<LanguageSwitchLinkProps> = ({ locale, href }) => {
  const router = useRouter();
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const isExternalHref = href?.startsWith('http');

  const dynamicKeys = useMemo(() => {
    return extractDynamicKeys(router.pathname);
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

  const buildLocalizedHref = () => {
    if (isExternalHref && href) {
      return href;
    }

    const basePath = (() => {
      if (href) {
        return href.startsWith('/') ? href : `/${href}`;
      }
      const pathWithParams = replaceDynamicSegments(router.pathname, router.query, dynamicKeys);
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
