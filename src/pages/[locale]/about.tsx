// pages/about.tsx
import { Container } from 'react-bootstrap';
import React from 'react';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { AUTHOR_NAME, CONTACT_LINKS, SOCIAL_MEDIA_NAMES } from '@/config/constants';
import { getStaticPaths, makeStaticProps } from '@/lib/getStatic';

export default function About() {
  const { t } = useTranslation(['about']);

  return (
    <>
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
        <ul className="list-unstyled fs-5 mt-3">
          <li className="mb-3">
            <FontAwesomeIcon icon="envelope" className="me-2 text-primary" />
            <strong>{t('about.contactInfo.email')}:</strong>{' '}
            <a href={CONTACT_LINKS.email} className="text-decoration-none">
              {CONTACT_LINKS.email.replace('mailto:', '')}
            </a>
          </li>
          <li className="mb-3">
            <FontAwesomeIcon icon={['fab', 'linkedin']} className="me-2 text-info" />
            <strong>{SOCIAL_MEDIA_NAMES.linkedin}:</strong>{' '}
            <a href={CONTACT_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              {CONTACT_LINKS.linkedin}
            </a>
          </li>
          <li className="mb-3">
            <FontAwesomeIcon icon={['fab', 'medium']} className="me-2 text-dark" />
            <strong>{SOCIAL_MEDIA_NAMES.medium}:</strong>{' '}
            <a href={CONTACT_LINKS.medium} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              {CONTACT_LINKS.medium}
            </a>
          </li>
          <li className="mb-3">
            <FontAwesomeIcon icon={['fab', 'github']} className="me-2 text-secondary" />
            <strong>{SOCIAL_MEDIA_NAMES.github}:</strong>{' '}
            <a href={CONTACT_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              {CONTACT_LINKS.github}
            </a>
          </li>
        </ul>
      </Container>
    </>
  );
}

const getStaticProps = makeStaticProps(['about', 'common']);
export { getStaticPaths, getStaticProps };
