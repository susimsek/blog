import { useRouter } from '@/navigation/router';
import languageDetector from '@/lib/languageDetector';
import i18nextConfig from '@/i18n/settings';
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
  for (const match of pathname.matchAll(/\[(?:\.\.\.)?([^\]]+)\]/g)) {
    const normalized = match[1]?.trim();
    if (normalized) {
      keys.add(normalized);
    }
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
    if (value === undefined) {
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
  const paramKeys = router.paramKeys ?? [];

  const isExternalHref = href?.startsWith('http');

  const dynamicKeys = useMemo(() => {
    return extractDynamicKeys(router.pathname);
  }, [router.pathname]);

  const sanitizedQuery = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(router.query).forEach(([key, value]) => {
      if (key === 'locale' || value === undefined || dynamicKeys.has(key) || paramKeys.includes(key)) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else {
        params.append(key, value);
      }
    });
    return params.toString();
  }, [router.query, dynamicKeys, paramKeys]);

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
