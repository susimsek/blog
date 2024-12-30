// pages/contact.tsx
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

type ContactProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Contact({ posts, topics }: Readonly<ContactProps>) {
  const { t } = useTranslation(['contact']);

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('contact.meta.title')}</title>
        <meta name="description" content={t('contact.meta.description')} />
        <meta name="keywords" content={t('contact.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
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
