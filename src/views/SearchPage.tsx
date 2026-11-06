'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import type { Localized } from '@/i18n/settings';
import type { SearchPageData } from '@/lib/localizedPageData';
import { useLocalizedContent } from '@/i18n/useLocalizedContent';

type SearchPageProps = { contentByLocale: Localized<SearchPageData> };

export default function SearchPage({ contentByLocale }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const { posts, topics } = useLocalizedContent(contentByLocale);
  const searchParams = useSearchParams();
  const routeQuery = (searchParams?.get('q') ?? '').trim();

  return (
    <Layout posts={posts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <div>
        <header className="page-header">
          <h1 className="page-header-title fw-bold">{t('search.title')}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('search.subtitle', { query: routeQuery })}</p>
        </header>
        <PostList
          posts={posts}
          topics={topics}
          noPostsFoundMessage={t('search.no_results', { query: routeQuery })}
          showLikes
        />
      </div>
    </Layout>
  );
}
