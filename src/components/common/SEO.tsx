import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import i18nextConfig from '@root/next-i18next.config';
import { AUTHOR_NAME, SITE_URL, TWITTER_USERNAME, AVATAR_LINK, LOCALES } from '@/config/constants';
import { useTranslation } from 'next-i18next';

interface ProfileProps {
  first_name: string;
  last_name: string;
}

interface ArticleProps {
  published_time: string;
  modified_time: string;
  tags?: string[];
}

interface JsonLdData {
  url?: string;
  mainEntityOfPage?: string | { '@type': 'WebPage'; '@id': string };
  inLanguage?: string;
  [key: string]: unknown;
}

interface SEOProps {
  title: string;
  ogTitle: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
  jsonLd?: JsonLdData;
  path?: string;
  profile?: ProfileProps;
  article?: ArticleProps;
}

const SEO: React.FC<SEOProps> = ({
  title,
  ogTitle,
  description,
  keywords = '',
  image = AVATAR_LINK,
  type = 'website',
  jsonLd,
  path = '',
  profile,
  article,
}) => {
  const router = useRouter();
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;
  const basePathSegment = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');
  const locales = i18nextConfig.i18n.locales ?? [i18nextConfig.i18n.defaultLocale];
  const ogLocale = LOCALES[currentLocale]?.ogLocale ?? LOCALES[i18nextConfig.i18n.defaultLocale]?.ogLocale;

  const { page, size } = router.query;

  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', String(page));
  if (size) queryParams.append('size', String(size));

  const siteUrl = SITE_URL.replace(/\/+$/g, '');
  const joinPath = (...segments: ReadonlyArray<string>) =>
    segments
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');

  const buildLocalizedUrl = (locale: string) => {
    const localizedPath = `/${joinPath(basePathSegment, locale, path)}`;
    return queryParams.toString() ? `${siteUrl}${localizedPath}?${queryParams}` : `${siteUrl}${localizedPath}`;
  };

  const canonicalUrl = buildLocalizedUrl(currentLocale);
  const alternateLinks = locales.map(locale => ({
    locale,
    hrefLang: locale,
    href: buildLocalizedUrl(locale),
  }));
  const xDefaultHref = buildLocalizedUrl(i18nextConfig.i18n.defaultLocale);

  const imageUrl = (() => {
    try {
      return new URL(image, SITE_URL).toString();
    } catch {
      return `${SITE_URL}${image}`;
    }
  })();
  const { t } = useTranslation('common');

  const siteName = t('common:common.siteName');

  const updatedJsonLd: JsonLdData | null = jsonLd ? { ...jsonLd, url: canonicalUrl } : null;

  if (updatedJsonLd) {
    const schemaLocale = (ogLocale ?? LOCALES[i18nextConfig.i18n.defaultLocale]?.ogLocale ?? currentLocale).replace(
      '_',
      '-',
    );
    updatedJsonLd.inLanguage = schemaLocale;

    if (article) {
      updatedJsonLd.mainEntityOfPage = { '@type': 'WebPage', '@id': canonicalUrl };
    } else if (updatedJsonLd['@type'] === 'ContactPage') {
      updatedJsonLd.inLanguage = schemaLocale;
    }
  }

  return (
    <Head>
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {alternateLinks.map(link => (
        <link key={link.locale} rel="alternate" hrefLang={link.hrefLang} href={link.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={AUTHOR_NAME} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={t('common:common.siteName')} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={ogTitle} />
      {ogLocale ? <meta property="og:locale" content={ogLocale} /> : null}
      {locales
        .filter(locale => locale !== currentLocale)
        .map(locale => {
          const altOgLocale = LOCALES[locale]?.ogLocale;
          return altOgLocale ? <meta key={altOgLocale} property="og:locale:alternate" content={altOgLocale} /> : null;
        })}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/webp" />

      {/* Optional profile properties */}
      {profile && (
        <>
          <meta property="profile:first_name" content={profile.first_name} />
          <meta property="profile:last_name" content={profile.last_name} />
        </>
      )}

      {/* Optional article properties */}
      {article && (
        <>
          <meta property="article:published_time" content={article.published_time} />
          <meta property="article:modified_time" content={article.modified_time} />
          <meta property="article:author" content={AUTHOR_NAME} />
          {article.tags && article.tags.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={TWITTER_USERNAME} />
      <meta name="twitter:site" content={TWITTER_USERNAME} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={ogTitle} />
      <meta name="twitter:url" content={canonicalUrl} />

      {/* JSON-LD Structured Data */}
      {updatedJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(updatedJsonLd) }} />
      )}
    </Head>
  );
};

export default SEO;
