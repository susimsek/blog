import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';
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
  mainEntityOfPage?: string;
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
  const ogLocale = LOCALES[currentLocale]?.ogLocale;

  const { page, size } = router.query;

  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', String(page));
  if (size) queryParams.append('size', String(size));

  const canonicalUrl = queryParams.toString()
    ? `${SITE_URL}/${currentLocale}${path}?${queryParams}`
    : `${SITE_URL}/${currentLocale}${path}`;

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
    const jsonLdLocale = ogLocale ?? LOCALES[i18nextConfig.i18n.defaultLocale]?.ogLocale;
    if (jsonLdLocale) {
      updatedJsonLd.inLanguage = jsonLdLocale;
    }
    if (article) {
      updatedJsonLd.mainEntityOfPage = canonicalUrl;
    } else if (updatedJsonLd['@type'] === 'ContactPage' && jsonLdLocale) {
      updatedJsonLd.inLanguage = jsonLdLocale;
    }
  }

  return (
    <Head>
      <title>
        {title} | {siteName}
      </title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
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
      <meta property="og:locale" content={ogLocale} />
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

      {/* JSON-LD Structured Data */}
      {updatedJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(updatedJsonLd) }} />
      )}
    </Head>
  );
};

export default SEO;
