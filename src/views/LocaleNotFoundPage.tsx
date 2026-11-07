'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from '@/components/common/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Layout from '@/components/common/Layout';

export default function LocaleNotFoundPage() {
  const { t } = useTranslation('404');

  return (
    <Layout>
      <section className="text-center py-5">
        <h1 className="display-1 fw-bold theme-text-danger">
          <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
          {t('404.errorCode')}
        </h1>
        <h2 className="mb-4">{t('404.header')}</h2>
        <p className="fs-5 theme-text-muted mb-4">{t('404.description')}</p>
        <Link href="/" className="btn btn-primary px-4">
          <FontAwesomeIcon icon="home" className="me-2" />
          {t('404.backToHome')}
        </Link>
      </section>
    </Layout>
  );
}
