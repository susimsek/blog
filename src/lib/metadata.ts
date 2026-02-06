import type { Metadata } from 'next';
import { AUTHOR_NAME, AVATAR_LINK, LOCALES, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import { defaultLocale, isSupportedLocale, locales } from '@/i18n/settings';

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

const toLocalizedPath = (locale: string, path = ''): string => `/${joinPath(basePathSegment, locale, path)}`;

const toAbsoluteUrl = (urlOrPath: string): string => {
  try {
    return new URL(urlOrPath, normalizedSiteUrl).toString();
  } catch {
    return `${normalizedSiteUrl}/${urlOrPath.replaceAll(/^\/+/g, '')}`;
  }
};

const toSupportedLocale = (locale: string): string => (isSupportedLocale(locale) ? locale : defaultLocale);

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

  const canonicalPath = toLocalizedPath(activeLocale, path);
  const languageAlternates = Object.fromEntries(
    locales.map(candidateLocale => [candidateLocale, toLocalizedPath(candidateLocale, path)]),
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
        'x-default': toLocalizedPath(defaultLocale, path),
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
          url: toAbsoluteUrl(image),
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
      images: [{ url: toAbsoluteUrl(image), alt: resolvedOgTitle }],
      ...twitter,
    },
  };
};
