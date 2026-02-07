'use client';

import React from 'react';
import Container from 'react-bootstrap/Container';
import { useTranslation } from 'react-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS } from '@/config/constants';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import type { PostSummary, Topic } from '@/types/posts';
import { toAbsoluteSiteUrl } from '@/lib/metadata';

type ContactPageProps = {
  layoutPosts: PostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function ContactPage({ layoutPosts, topics, preFooterTopTopics }: Readonly<ContactPageProps>) {
  const { t } = useTranslation(['contact']);
  const siteRootUrl = toAbsoluteSiteUrl('/');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: t('contact.meta.title'),
    description: t('contact.meta.description'),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: siteRootUrl,
      image: toAbsoluteSiteUrl(AVATAR_LINK),
      jobTitle: t('contact.jobTitle'),
      email: CONTACT_LINKS.email,
      sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
      gender: 'male',
      nationality: 'Turkish',
    },
  };

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={true}
      sidebarEnabled={true}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      <Container className="py-5" style={{ maxWidth: '800px' }}>
        <h1 className="fw-bold mb-4">{t('contact.header')}</h1>
        <p className="fs-5">{t('contact.description')}</p>
        <h2 className="fw-bold mt-4">{t('contact.title')}</h2>
        <ContactInfo />
      </Container>
    </Layout>
  );
}
