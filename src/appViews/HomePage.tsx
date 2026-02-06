'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_URL } from '@/config/constants';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import PostCarousel from '@/components/posts/PostCarousel';
import type { PostSummary, Topic } from '@/types/posts';

type HomePageProps = {
  posts: PostSummary[];
  topics: Topic[];
  locale: string;
};

export default function HomePage({ posts, topics, locale }: Readonly<HomePageProps>) {
  const { t } = useTranslation('home');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('home.meta.title'),
    description: t('home.meta.description'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
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
      <header className="text-center py-4">
        <h1 className="fw-bold mb-4">{t('home.header.title')}</h1>
        <p className="text-muted fs-4">{t('home.header.subtitle')}</p>
      </header>
      <PostCarousel posts={posts.slice(0, 3)} />
      <PostList posts={posts} topics={topics} />
    </Layout>
  );
}
