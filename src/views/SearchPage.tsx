'use client';

import React, { useEffect } from 'react';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setQuery } from '@/reducers/postsQuery';

interface SearchPageProps {
  allPosts: PostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
}

export default function SearchPage({ allPosts, topics, preFooterTopTopics }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { query } = useAppSelector(state => state.postsQuery);

  useEffect(() => {
    const q = searchParams.get('q');
    dispatch(setQuery(q ?? ''));
  }, [searchParams, dispatch]);

  return (
    <Layout
      posts={allPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      sidebarEnabled={true}
      searchEnabled={true}
    >
      <div>
        <header className="page-header">
          <h1 className="page-header-title fw-bold">{t('search.title')}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('search.subtitle', { query: query || '' })}</p>
        </header>
        <PostList
          posts={allPosts}
          searchEnabled={false}
          highlightQuery={query}
          noPostsFoundMessage={t('search.no_results', { query: query || '' })}
        />
      </div>
    </Layout>
  );
}
