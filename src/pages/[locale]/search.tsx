import React, { useMemo } from 'react';
import Head from 'next/head';
import { makeSearchProps } from '@/lib/posts';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getStaticPaths } from '@/lib/getStatic';
import { filterByQuery } from '@/lib/postFilters';
import useDebounce from '@/hooks/useDebounce';

interface SearchPageProps {
  allPosts: PostSummary[];
  topics: Topic[];
}

export default function SearchPage({ allPosts, topics }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const router = useRouter();
  const { q } = router.query;

  // Use debounce hook for the search query
  const debouncedQuery = useDebounce(q, 500); // 500ms delay

  const filteredPosts = useMemo(() => {
    if (debouncedQuery && typeof debouncedQuery === 'string') {
      return allPosts.filter(post => filterByQuery(post, debouncedQuery));
    }
    return allPosts;
  }, [debouncedQuery, allPosts]);

  return (
    <Layout posts={allPosts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <Head>
        <title>{t('search.title', { query: debouncedQuery || '' })}</title>
        <meta name="description" content={t('search.meta.description', { query: debouncedQuery || '' })} />
        <meta name="keywords" content={t('search.meta.keywords', { query: debouncedQuery || '' })} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div>
        <header className="text-center py-4">
          <h1 className="fw-bold mb-4">{t('search.title')}</h1>
          <p className="text-muted fs-4">{t('search.subtitle', { query: debouncedQuery || '' })}</p>
        </header>
        <PostList
          posts={filteredPosts}
          searchEnabled={false}
          noPostsFoundMessage={t('search.no_results', { query: debouncedQuery || '' })}
        />
      </div>
    </Layout>
  );
}

const getStaticProps = makeSearchProps(['common', 'search', 'post']);

// Generate static paths
export { getStaticPaths, getStaticProps };
