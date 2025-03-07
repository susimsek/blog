import React from 'react';
import Head from 'next/head';
import { getAllTopicIds, makeTopicProps } from '@/lib/posts';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_URL } from '@/config/constants';
import { useTranslation } from 'next-i18next';
import SEO from '@/components/common/SEO';

type TopicPageProps = {
  topic: Topic;
  posts: PostSummary[];
  topics: Topic[];
  allPosts: PostSummary[];
};

export default function TopicPage({ topic, posts, topics, allPosts }: Readonly<TopicPageProps>) {
  const { t } = useTranslation(['topic']);

  const url = `${SITE_URL}/topics/${topic.id}`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('topic.title', { topic: topic.name }),
    description: t('topic.meta.description', { topic: topic.name }),
    url: url,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
  };

  return (
    <Layout posts={allPosts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <Head>
        <title>{t('topic.title', { topic: topic.name })}</title>
        <meta name="description" content={t('topic.meta.description', { topic: topic.name })} />
        <meta name="keywords" content={t('topic.meta.keywords', { topic: topic.name })} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
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
