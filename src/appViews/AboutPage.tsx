'use client';

import React from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS, EXPERIENCE_START_YEAR } from '@/config/constants';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import type { PostSummary, Topic } from '@/types/posts';
import { toAbsoluteSiteUrl } from '@/lib/metadata';

type AboutPageProps = {
  layoutPosts: PostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function AboutPage({ layoutPosts, topics, preFooterTopTopics }: Readonly<AboutPageProps>) {
  const { t } = useTranslation(['about']);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    image: toAbsoluteSiteUrl(AVATAR_LINK),
    jobTitle: t('about.jobTitle'),
    email: CONTACT_LINKS.email,
    sameAs: [CONTACT_LINKS.linkedin, CONTACT_LINKS.medium, CONTACT_LINKS.github],
    gender: 'male',
    nationality: 'Turkish',
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
