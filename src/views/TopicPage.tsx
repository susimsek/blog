'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';
import { useTranslation } from 'react-i18next';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Link from '@/components/common/Link';
import { buildLocalizedAbsoluteUrl, toAbsoluteSiteUrl } from '@/lib/metadata';

type TopicPageProps = {
  topic: Topic;
  posts: PostSummary[];
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
  locale: string;
};

export default function TopicPage({
  topic,
  posts,
  layoutPosts,
  topics,
  preFooterTopTopics,
  locale,
}: Readonly<TopicPageProps>) {
  const { t } = useTranslation(['topic', 'common']);
  const siteRootUrl = toAbsoluteSiteUrl('/');
  const blogLabel = t('common.searchSource.blog', { ns: 'common' });
  const topicBreadcrumbLabel = topic.name;
  const topicTitle = t('topic.title', { topic: topic.name });
  const blogUrl = buildLocalizedAbsoluteUrl(locale);
  const topicUrl = buildLocalizedAbsoluteUrl(locale, `topics/${topic.id}`);

  const description = t('topic.meta.description', { topic: topic.name });

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: topicTitle,
    description,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: siteRootUrl,
    },
  };

  const breadcrumbJsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: blogLabel,
        item: blogUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: topicBreadcrumbLabel,
        item: topicUrl,
      },
    ],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLdData) }} />
      <div>
        <nav className="post-detail-breadcrumb" aria-label="Breadcrumb">
          <Breadcrumb as="ol" className="mb-0 ms-0 ps-0">
            <Breadcrumb.Item linkAs={Link} href="/">
              {blogLabel}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>{topicBreadcrumbLabel}</Breadcrumb.Item>
          </Breadcrumb>
        </nav>
        <header className="page-header page-header-after-breadcrumb">
          <h1 className="page-header-title fw-bold">{topicTitle}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('topic.subtitle', { topic: topic.name })}</p>
        </header>
        <PostList posts={posts} noPostsFoundMessage={t('topic.no_posts', { topic: topic.name })} />
      </div>
    </Layout>
  );
}
