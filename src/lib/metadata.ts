import type { Metadata } from 'next';
import { AUTHOR_NAME, AVATAR_LINK, LOCALES, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import { defaultLocale, isSupportedLocale, locales } from '@/i18n/settings';
import type { Locale } from '@/i18n/settings';

type BuildPageMetadataOptions = {
  locale: string;
  title: string;
  description: string;
  keywords?: string;
  path?: string;
  image?: string;
  ogTitle?: string;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
  openGraph?: Metadata['openGraph'];
  twitter?: Metadata['twitter'];
};

const normalizedSiteUrl = SITE_URL.replaceAll(/\/+$/g, '');
const basePathSegment = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replaceAll(/^\/+/g, '').replaceAll(/\/+$/g, '');

const joinPath = (...segments: ReadonlyArray<string>): string =>
  segments
    .map(segment => segment.trim())
    .filter(Boolean)
    .map(segment => segment.replaceAll(/^\/+/g, '').replaceAll(/\/+$/g, ''))
    .filter(Boolean)
    .join('/');

const prefixedBasePath = basePathSegment ? `/${basePathSegment}` : '';

const isAbsoluteUrl = (value: string): boolean => {
  try {
    return Boolean(new URL(value).protocol);
  } catch {
    return false;
  }
};

const startsWithBasePath = (value: string): boolean => {
  if (!prefixedBasePath) {
    return false;
  }
  return value === prefixedBasePath || value.startsWith(`${prefixedBasePath}/`);
};

export const buildSitePath = (path = ''): string => {
  const joinedPath = joinPath(basePathSegment, path);
  return joinedPath ? `/${joinedPath}` : '/';
};

export const buildLocalizedPath = (locale: string, path = ''): string => buildSitePath(joinPath(locale, path));

export const toAbsoluteSiteUrl = (urlOrPath: string): string => {
  if (!urlOrPath) {
    return normalizedSiteUrl;
  }

  if (isAbsoluteUrl(urlOrPath)) {
    return urlOrPath;
  }

  const normalizedPath = urlOrPath.startsWith('/')
    ? startsWithBasePath(urlOrPath)
      ? urlOrPath
      : buildSitePath(urlOrPath)
    : buildSitePath(urlOrPath);

  try {
    return new URL(normalizedPath, normalizedSiteUrl).toString();
  } catch {
    return `${normalizedSiteUrl}/${normalizedPath.replaceAll(/^\/+/g, '')}`;
  }
};

export const buildLocalizedAbsoluteUrl = (locale: string, path = ''): string =>
  toAbsoluteSiteUrl(buildLocalizedPath(locale, path));

const toSupportedLocale = (locale: string): Locale => (isSupportedLocale(locale) ? locale : defaultLocale);

export const getMetadataBase = (): URL => {
  try {
    return new URL(normalizedSiteUrl);
  } catch {
    return new URL('https://example.com');
  }
};

export const buildNotFoundMetadata = (): Metadata => ({
  title: 'Not Found',
  robots: { index: false, follow: false },
});

export const buildPageMetadata = ({
  locale,
  title,
  description,
  keywords = '',
  path = '',
  image = AVATAR_LINK,
  ogTitle,
  type = 'website',
  robots,
  openGraph,
  twitter,
}: Readonly<BuildPageMetadataOptions>): Metadata => {
  const activeLocale = toSupportedLocale(locale);
  const resolvedOgTitle = ogTitle ?? title;
  const ogLocale = LOCALES[activeLocale]?.ogLocale;
  const alternateLocales = locales
    .filter(candidateLocale => candidateLocale !== activeLocale)
    .map(candidateLocale => LOCALES[candidateLocale]?.ogLocale)
    .filter((candidateLocale): candidateLocale is string => Boolean(candidateLocale));

  const canonicalPath = buildLocalizedPath(activeLocale, path);
  const languageAlternates = Object.fromEntries(
    locales.map(candidateLocale => [candidateLocale, buildLocalizedPath(candidateLocale, path)]),
  );

  return {
    title,
    description,
    keywords,
    authors: [{ name: AUTHOR_NAME }],
    alternates: {
      canonical: canonicalPath,
      languages: {
        ...languageAlternates,
        'x-default': buildLocalizedPath(defaultLocale, path),
      },
    },
    robots: robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: resolvedOgTitle,
      description,
      type,
      url: canonicalPath,
      siteName: AUTHOR_NAME,
      locale: ogLocale,
      alternateLocale: alternateLocales,
      images: [
        {
          url: toAbsoluteSiteUrl(image),
          width: 1200,
          height: 630,
          alt: resolvedOgTitle,
          type: 'image/webp',
        },
      ],
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      creator: TWITTER_USERNAME,
      site: TWITTER_USERNAME,
      title: resolvedOgTitle,
      description,
      images: [{ url: toAbsoluteSiteUrl(image), alt: resolvedOgTitle }],
      ...twitter,
    },
  };
};
