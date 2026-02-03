// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO, SITE_URL } from '@/config/constants';
import SEO from '@/components/common/SEO';
import { getRelatedPosts } from '@/lib/postFilters';

type PostProps = {
  post: Post;
  posts?: PostSummary[];
};

export default function Post({ post, posts = [] }: Readonly<PostProps>) {
  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');
  const relatedPosts = getRelatedPosts(post, posts, 3);

  const logoUrl = (() => {
    try {
      return new URL(SITE_LOGO, SITE_URL).toString();
    } catch {
      return `${SITE_URL}${SITE_LOGO}`;
    }
  })();

  const imageUrl = (() => {
    if (!post.thumbnail) {
      return null;
    }
    try {
      return new URL(post.thumbnail, SITE_URL).toString();
    } catch {
      return `${SITE_URL}${post.thumbnail}`;
    }
  })();

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
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
    keywords: keywords,
    name: post.title,
    description: post.summary,
    identifier: post.id,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: SITE_URL,
    },
    creator: [AUTHOR_NAME],
    publisher: {
      '@type': 'Organization',
      name: AUTHOR_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 1200,
        height: 630,
      },
    },
  };

  const articleData = {
    published_time: post.date,
    modified_time: post.date,
    tags: (post.topics ?? []).map(topic => topic.name),
  };

  return (
    <Layout posts={posts} searchEnabled={true}>
      <SEO
        title={post.title}
        ogTitle={post.title}
        description={post.summary}
        keywords={keywords}
        image={post.thumbnail ?? undefined}
        type="article"
        path={`/posts/${post.id}`}
        article={articleData}
        jsonLd={jsonLdData}
      />
      <PostDetail post={post} relatedPosts={relatedPosts} />
    </Layout>
  );
}

const getStaticProps = makePostDetailProps(['common', 'post']);

async function getStaticPaths() {
  const paths = await getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export { getStaticPaths, getStaticProps };
