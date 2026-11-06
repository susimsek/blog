'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import type { LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import PostList from '@/components/posts/PostList';
import type { Localized } from '@/i18n/settings';
import type { MediumPageData } from '@/lib/localizedPageData';
import { useLocalizedContent } from '@/i18n/useLocalizedContent';

type MediumPageProps = { contentByLocale: Localized<MediumPageData> };

export default function MediumPage({ contentByLocale }: Readonly<MediumPageProps>) {
  const { t } = useTranslation('medium');
  const { layoutPosts, topics, preFooterTopTopics, mediumPosts } = useLocalizedContent(contentByLocale);

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
      <header className="page-header">
        <h1 className="page-header-title fw-bold">{t('medium.header.title')}</h1>
        <p className="page-header-subtitle text-muted fs-4">{t('medium.header.subtitle')}</p>
      </header>
      <PostList posts={mediumPosts} topics={topics} />
    </Layout>
  );
}
