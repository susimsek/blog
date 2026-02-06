'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_URL } from '@/config/constants';
import { useTranslation } from 'react-i18next';

type TopicPageProps = {
  topic: Topic;
  posts: PostSummary[];
  layoutPosts: PostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function TopicPage({ topic, posts, layoutPosts, topics, preFooterTopTopics }: Readonly<TopicPageProps>) {
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
      url: SITE_URL,
    },
  };

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      sidebarEnabled={true}
      searchEnabled={true}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
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
