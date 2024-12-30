// pages/[locale]/about.tsx
import React from 'react';
import { Container } from 'react-bootstrap';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME } from '@/config/constants';
import { getStaticPaths } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import { makePostProps } from '@/lib/posts';
import { PostSummary, Topic } from '@/types/posts';

type AboutProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function About({ posts, topics }: Readonly<AboutProps>) {
  const { t } = useTranslation(['about']);

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('about.meta.title')}</title>
        <meta name="description" content={t('about.meta.description')} />
        <meta name="keywords" content={t('about.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
      </Head>
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('about.header')}</h1>
        <p className="fs-5">{t('about.description')}</p>
        <h2 className="fw-bold mt-4">{t('about.findMeOnline')}</h2>
        <ContactInfo />
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'about']);

export { getStaticPaths, getStaticProps };
