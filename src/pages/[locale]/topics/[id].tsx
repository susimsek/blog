import React from 'react';
import Head from 'next/head';
import { getAllTopicIds, makeTopicProps } from '@/lib/posts';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';
import { useTranslation } from 'next-i18next';

type TopicPageProps = {
  topic: Topic;
  posts: PostSummary[];
};

export default function TopicPage({ topic, posts }: Readonly<TopicPageProps>) {
  const { t } = useTranslation(['topic']);

  return (
    <Layout>
      <Head>
        <title>{t('topic.title', { topic: topic.name })}</title>
        <meta name="description" content={t('topic.meta.description', { topic: topic.name })} />
        <meta name="keywords" content={t('topic.meta.keywords', { topic: topic.name })} />
        <meta name="author" content={AUTHOR_NAME} />
      </Head>
      <div>
        <header className="text-center py-4">
          <h1 className="fw-bold mb-4">{t('topic.title', { topic: topic.name })}</h1>
          <p className="text-muted fs-4">{t('topic.subtitle', { topic: topic.name })}</p>
        </header>
        <PostList posts={posts} noPostsFoundMessage={t('topic.no_posts', { topic: topic.name })} />
      </div>
    </Layout>
  );
}

const getStaticProps = makeTopicProps(['common', 'topic', 'post']);

// Generate static paths for all topics
async function getStaticPaths() {
  const paths = getAllTopicIds();

  return {
    paths,
    fallback: false,
  };
}

export { getStaticPaths, getStaticProps };
