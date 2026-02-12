'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/config/store';

interface SearchPageProps {
  topics: Topic[];
}

export default function SearchPage({ topics }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const searchParams = useSearchParams();
  const routeQuery = searchParams.get('q') ?? '';
  const { posts: fetchedPosts } = useAppSelector(state => state.postsQuery);

  return (
    <Layout posts={fetchedPosts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <div>
        <header className="page-header">
          <h1 className="page-header-title fw-bold">{t('search.title')}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('search.subtitle', { query: routeQuery })}</p>
        </header>
        <PostList posts={fetchedPosts} noPostsFoundMessage={t('search.no_results', { query: routeQuery })} />
      </div>
    </Layout>
  );
}
