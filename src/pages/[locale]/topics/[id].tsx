import React from 'react';
import { getAllTopicIds, makeTopicProps } from '@/lib/posts';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO } from '@/config/constants';
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

  const topicTitle = t('topic.title', { topic: topic.name });
  const description = t('topic.meta.description', { topic: topic.name });

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topicTitle,
    description,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
  };

  return (
    <Layout posts={allPosts} topics={topics} sidebarEnabled={true} searchEnabled={true}>
      <SEO
        type="website"
        title={topicTitle}
        ogTitle={topicTitle}
        description={description}
        keywords={t('topic.meta.keywords', { topic: topic.name })}
        path={`/topics/${topic.id}`}
        image={SITE_LOGO}
        jsonLd={jsonLdData}
      />
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
