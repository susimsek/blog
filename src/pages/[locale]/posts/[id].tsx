// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO, SITE_URL } from '@/config/constants';
import SEO from '@/components/common/SEO';

type PostProps = {
  post: Post;
  posts: PostSummary[];
};

export default function Post({ post, posts }: Readonly<PostProps>) {
  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');

  const image = `${SITE_URL}${post.thumbnail}`;

  const jsonLdData = {
    '@context': 'http://schema.org',
    '@type': 'NewsArticle',
    image: [image],
    dateCreated: post.date,
    datePublished: post.date,
    dateModified: post.date,
    headline: post.title,
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
        width: 1200,
        height: 630,
        url: `${SITE_URL}${SITE_LOGO}`,
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
        image={post.thumbnail}
        type="article"
        path={`/posts/${post.id}`}
        article={articleData}
        jsonLd={jsonLdData}
      />
      <PostDetail post={post} />
    </Layout>
  );
}

const getStaticProps = makePostDetailProps(['common', 'post']);

async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export { getStaticPaths, getStaticProps };
