import React, { useEffect } from 'react';
import Head from 'next/head';
import { makeSearchProps } from '@/lib/posts';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { getStaticPaths } from '@/lib/getStatic';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setQuery } from '@/reducers/postsQuery';

interface SearchPageProps {
  allPosts: PostSummary[];
  topics: Topic[];
}

export default function SearchPage({ allPosts, topics }: Readonly<SearchPageProps>) {
  const { t } = useTranslation(['search']);
  const router = useRouter();
  const { q } = router.query;
  const dispatch = useAppDispatch();
  const { query } = useAppSelector(state => state.postsQuery);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (typeof q === 'string') {
      dispatch(setQuery(q));
    } else {
      dispatch(setQuery(''));
    }
  }, [router.isReady, q, dispatch]);

  return (
    <Layout posts={allPosts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <Head>
        <title>{t('search.title', { query: query || '' })}</title>
        <meta name="description" content={t('search.meta.description', { query: query || '' })} />
        <meta name="keywords" content={t('search.meta.keywords', { query: query || '' })} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="noindex, follow" />
      </Head>
      <div>
        <header className="text-center py-4">
          <h1 className="fw-bold mb-4">{t('search.title')}</h1>
          <p className="text-muted fs-4">{t('search.subtitle', { query: query || '' })}</p>
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

const getStaticProps = makeSearchProps(['common', 'search', 'post']);

// Generate static paths
export { getStaticPaths, getStaticProps };
