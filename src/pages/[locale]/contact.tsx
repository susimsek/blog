// pages/contact.tsx
import React from 'react';
import { Container } from 'react-bootstrap';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME } from '@/config/constants';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';

export default function Contact() {
  const { t } = useTranslation(['contact']);

  return (
    <Layout>
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

const getStaticProps = makeStaticProps(['contact', 'common']);
export { getStaticPaths, getStaticProps };
