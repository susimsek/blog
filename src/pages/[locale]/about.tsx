import React from 'react';
import { Container, Card } from 'react-bootstrap';
import Head from 'next/head';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import {
  AUTHOR_NAME,
  AVATAR_LINK,
  CONTACT_LINKS,
  EXPERIENCE_START_YEAR,
  LOCALES,
  PROFILE_FIRST_NAME,
  PROFILE_LAST_NAME,
  SITE_URL,
  TWITTER_USERNAME,
} from '@/config/constants';
import { getStaticPaths } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';

type AboutProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function About({ posts, topics }: Readonly<AboutProps>) {
  const { t } = useTranslation(['about']);

  const router = useRouter();

  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const url = `${SITE_URL}/about`;
  const localizedUrl = `${SITE_URL}/${currentLocale}/about`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: localizedUrl,
    image: AVATAR_LINK,
    jobTitle: t('about.jobTitle'),
    email: CONTACT_LINKS.email,
    sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('about.meta.title')}</title>
        <meta name="description" content={t('about.meta.description')} />
        <link rel="canonical" href={url} />
        <meta name="keywords" content={t('about.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={t('about.meta.title')} />
        <meta property="og:description" content={t('about.meta.description')} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={localizedUrl} />
        <meta property="og:site_name" content={t('common:common.siteName')} />
        <meta property="og:image" content={AVATAR_LINK} />
        <meta property="og:image:width" content="400" />
        <meta property="og:image:height" content="400" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale" content={LOCALES[currentLocale]?.ogLocale} />
        <meta property="profile:first_name" content={PROFILE_FIRST_NAME} />
        <meta property="profile:last_name" content={PROFILE_LAST_NAME} />

        {/* Twitter Card meta tags for sharing on Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content={TWITTER_USERNAME} />
        <meta name="twitter:site" content={TWITTER_USERNAME} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      </Head>
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('about.header')}</h1>
        <Card>
          <Container>
            <Card.Body className="px-0">
              <div className="mb-3 text-center">
                <Image src={AVATAR_LINK} alt="Şuayb Şimşek" width={150} height={150} className="rounded-circle" />
              </div>
              <Card.Text className="fs-5">
                {t('about.description', { experienceYears: new Date().getFullYear() - EXPERIENCE_START_YEAR })}
              </Card.Text>
              <hr />
              <h2 className="fw-bold mt-4">{t('about.findMeOnline')}</h2>
              <ContactInfo />
            </Card.Body>
          </Container>
        </Card>
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'about']);

export { getStaticPaths, getStaticProps };
