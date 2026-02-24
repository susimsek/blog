'use client';

import React from 'react';
import PostList from '@/components/posts/PostList';
import type { Category, LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';
import { useTranslation } from 'react-i18next';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Link from '@/components/common/Link';
import { buildLocalizedAbsoluteUrl, toAbsoluteSiteUrl } from '@/lib/metadata';

type CategoryPageProps = {
  category: Category;
  posts: PostSummary[];
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
  locale: string;
};

export default function CategoryPage({
  category,
  posts,
  layoutPosts,
  topics,
  preFooterTopTopics,
  locale,
}: Readonly<CategoryPageProps>) {
  const { t } = useTranslation(['category', 'common']);
  const siteRootUrl = toAbsoluteSiteUrl('/');
  const blogLabel = t('common.searchSource.blog', { ns: 'common' });
  const categoryBreadcrumbLabel = category.name;
  const categoryTitle = t('category.title', { category: category.name });
  const blogUrl = buildLocalizedAbsoluteUrl(locale);
  const categoryUrl = buildLocalizedAbsoluteUrl(locale, `categories/${category.id}`);

  const description = t('category.meta.description', { category: category.name });

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryTitle,
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
        name: categoryBreadcrumbLabel,
        item: categoryUrl,
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
            <Breadcrumb.Item active>{categoryBreadcrumbLabel}</Breadcrumb.Item>
          </Breadcrumb>
        </nav>
        <header className="page-header page-header-after-breadcrumb">
          <h1 className="page-header-title fw-bold">{categoryTitle}</h1>
          <p className="page-header-subtitle text-muted fs-4">{t('category.subtitle', { category: category.name })}</p>
        </header>
        <PostList posts={posts} noPostsFoundMessage={t('category.no_posts', { category: category.name })} />
      </div>
    </Layout>
  );
}
