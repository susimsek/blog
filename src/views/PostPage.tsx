'use client';

import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { LayoutPostSummary, Post, PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO } from '@/config/constants';
import { resolvePostContent } from '@/lib/contentCompression';
import { buildLocalizedAbsoluteUrl, toAbsoluteSiteUrl } from '@/lib/metadata';
import type { AdjacentPostLink } from '@/lib/postFilters';
import { useTranslation } from 'react-i18next';

type PostPageProps = {
  post: Post;
  relatedPosts?: PostSummary[];
  previousPost?: AdjacentPostLink | null;
  nextPost?: AdjacentPostLink | null;
  layoutPosts?: LayoutPostSummary[];
  preFooterTopTopics?: Topic[];
  locale: string;
};

export default function PostPage({
  post,
  relatedPosts = [],
  previousPost = null,
  nextPost = null,
  layoutPosts = [],
  preFooterTopTopics = [],
  locale,
}: Readonly<PostPageProps>) {
  const { t } = useTranslation('common');
  const postWithContent = React.useMemo(() => {
    const contentHtml = resolvePostContent(post);
    return { ...post, contentHtml };
  }, [post]);

  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');
  const siteRootUrl = toAbsoluteSiteUrl('/');
  const homeUrl = buildLocalizedAbsoluteUrl(locale);
  const postUrl = buildLocalizedAbsoluteUrl(locale, `posts/${post.id}`);

  const logoUrl = toAbsoluteSiteUrl(SITE_LOGO);

  const imageUrl = post.thumbnail ? toAbsoluteSiteUrl(post.thumbnail) : null;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    inLanguage: locale,
    ...(imageUrl
      ? {
          image: {
            '@type': 'ImageObject',
            url: imageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
    dateCreated: post.date,
    datePublished: post.date,
    dateModified: post.date,
    headline: post.title,
    keywords,
    name: post.title,
    description: post.summary,
    identifier: post.id,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: siteRootUrl,
    },
    creator: [AUTHOR_NAME],
    publisher: {
      '@type': 'Organization',
      name: AUTHOR_NAME,
      url: siteRootUrl,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 1200,
        height: 630,
      },
    },
  };

  const blogLabel = t('common.searchSource.blog', { ns: 'common' });

  const breadcrumbJsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: blogLabel,
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <Layout posts={layoutPosts} preFooterTopTopics={preFooterTopTopics} searchEnabled={true}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLdData) }} />
      <PostDetail post={postWithContent} relatedPosts={relatedPosts} previousPost={previousPost} nextPost={nextPost} />
    </Layout>
  );
}
