'use client';

import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary, Topic } from '@/types/posts';
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO } from '@/config/constants';
import { resolvePostContent } from '@/lib/contentCompression';
import { toAbsoluteSiteUrl } from '@/lib/metadata';

type PostPageProps = {
  post: Post;
  relatedPosts?: PostSummary[];
  layoutPosts?: PostSummary[];
  preFooterTopTopics?: Topic[];
  locale: string;
};

export default function PostPage({
  post,
  relatedPosts = [],
  layoutPosts = [],
  preFooterTopTopics = [],
  locale,
}: Readonly<PostPageProps>) {
  const postWithContent = React.useMemo(() => {
    const contentHtml = resolvePostContent(post);
    return { ...post, contentHtml };
  }, [post]);

  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');
  const siteRootUrl = toAbsoluteSiteUrl('/');

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

  return (
    <Layout posts={layoutPosts} preFooterTopTopics={preFooterTopTopics} searchEnabled={true}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      <PostDetail post={postWithContent} relatedPosts={relatedPosts} />
    </Layout>
  );
}
