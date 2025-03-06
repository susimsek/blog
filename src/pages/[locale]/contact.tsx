import React from 'react';
import { Container } from 'react-bootstrap';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS, LOCALES, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import { getStaticPaths } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';

type ContactProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Contact({ posts, topics }: Readonly<ContactProps>) {
  const { t } = useTranslation(['contact']);

  const router = useRouter();

  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const localizedUrl = `${SITE_URL}/${currentLocale}/contact`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t('contact.meta.title'),
    description: t('contact.meta.description'),
    url: localizedUrl,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
      image: AVATAR_LINK,
      jobTitle: t('contact.jobTitle'),
      email: CONTACT_LINKS.email,
      sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
    },
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('contact.meta.title')}</title>
        <meta name="description" content={t('contact.meta.description')} />
        <link rel="canonical" href={localizedUrl} />
        <meta name="keywords" content={t('contact.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={t('about.meta.title')} />
        <meta property="og:description" content={t('about.meta.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={localizedUrl} />
        <meta property="og:site_name" content={t('common:common.siteName')} />
        <meta property="og:image" content={AVATAR_LINK} />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale" content={LOCALES[currentLocale]?.ogLocale} />

        {/* Twitter Card meta tags for sharing on Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content={TWITTER_USERNAME} />
        <meta name="twitter:site" content={TWITTER_USERNAME} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      </Head>
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('contact.header')}</h1>
        <p className="fs-5">{t('contact.description')}</p>
        <h2 className="fw-bold mt-4">{t('contact.title')}</h2>
        <ContactInfo />
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'contact']);

export { getStaticPaths, getStaticProps };
