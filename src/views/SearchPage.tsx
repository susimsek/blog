'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/config/store';

interface SearchPageProps {
  posts: PostSummary[];
  topics: Topic[];
}

export default function SearchPage({ posts, topics }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const { query } = useAppSelector(state => state.postsQuery);
  const routeQuery = query.trim();

  return (
    <Layout posts={posts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <div>
        <header className="page-header">
          <h1 className="page-header-title fw-bold">{t('search.title')}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('search.subtitle', { query: routeQuery })}</p>
        </header>
        <PostList posts={posts} noPostsFoundMessage={t('search.no_results', { query: routeQuery })} showLikes />
      </div>
    </Layout>
  );
}
