'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import type { LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import PostList from '@/components/posts/PostList';

type MediumPageProps = {
  mediumPosts: PostSummary[];
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function MediumPage({
  layoutPosts,
  topics,
  preFooterTopTopics,
  mediumPosts,
}: Readonly<MediumPageProps>) {
  const { t } = useTranslation('medium');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('medium.meta.title'),
    description: t('medium.meta.description'),
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
      <header className="text-center py-4">
        <h1 className="fw-bold mb-4">{t('medium.header.title')}</h1>
        <p className="text-muted fs-4">{t('medium.header.subtitle')}</p>
      </header>
      <PostList posts={mediumPosts} />
    </Layout>
  );
}
