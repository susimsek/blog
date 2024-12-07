// pages/404.tsx
import { Container } from 'react-bootstrap';
import React from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import Link from '@/components/common/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';
import Layout from '@/components/common/Layout';

export default function NotFound() {
  const { t } = useTranslation('404');

  return (
    <Layout>
      <Head>
        <title>{t('404.title')}</title>
        <meta name="description" content={t('404.meta.description')} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Container className="text-center py-5" style={{ maxWidth: '800px' }}>
        <h1 className="display-1 fw-bold text-danger">
          <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
          {t('404.errorCode')}
        </h1>
        <h2 className="mb-4">{t('404.header')}</h2>
        <p className="fs-5 text-muted mb-4">{t('404.description')}</p>
        <Link href="/" className="btn btn-primary px-4">
          <FontAwesomeIcon icon="home" className="me-2" />
          {t('404.backToHome')}
        </Link>
      </Container>
    </Layout>
  );
}

const getStaticProps = makeStaticProps(['404', 'common']);
export { getStaticPaths, getStaticProps };
