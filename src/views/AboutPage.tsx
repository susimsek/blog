'use client';

import React from 'react';
import Card from 'react-bootstrap/Card';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { AUTHOR_NAME, AVATAR_LINK, CONTACT_LINKS, EXPERIENCE_START_YEAR } from '@/config/constants';
import Layout from '@/components/common/Layout';
import ContactInfo from '@/components/common/ContactInfo';
import type { LayoutPostSummary, Topic } from '@/types/posts';
import { toAbsoluteSiteUrl } from '@/lib/metadata';

type AboutPageProps = {
  layoutPosts: LayoutPostSummary[];
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
      <section className="py-5">
        <h1 className="fw-bold mb-4">{t('about.header')}</h1>
        <Card>
          <Card.Body className="px-4">
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
        </Card>
      </section>
    </Layout>
  );
}
