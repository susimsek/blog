'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import PostCarousel from '@/components/posts/PostCarousel';
import type { PostSummary, Topic } from '@/types/posts';
import { buildLocalizedAbsoluteUrl } from '@/lib/metadata';

type HomePageProps = {
  posts: PostSummary[];
  topics: Topic[];
  locale: string;
};

export default function HomePage({ posts, topics, locale }: Readonly<HomePageProps>) {
  const { t } = useTranslation('home');
  const searchUrl = buildLocalizedAbsoluteUrl(locale, 'search');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('home.meta.title'),
    description: t('home.meta.description'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': {
        '@type': 'PropertyValueSpecification',
        valueRequired: true,
        valueName: 'search_term_string',
      },
    },
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      <header className="page-header">
        <h1 className="page-header-title fw-bold">{t('home.header.title')}</h1>
        <p className="page-header-subtitle text-muted fs-4">{t('home.header.subtitle')}</p>
      </header>
      <PostCarousel posts={posts.slice(0, 3)} />
      <PostList posts={posts} />
    </Layout>
  );
}
