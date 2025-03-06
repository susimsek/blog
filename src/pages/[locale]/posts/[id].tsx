// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, LOCALES, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../../next-i18next.config';
import { useTranslation } from 'next-i18next';
import SEO from '@/components/common/SEO';

type PostProps = {
  post: Post;
  posts: PostSummary[];
};

export default function Post({ post, posts }: Readonly<PostProps>) {
  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');

  const image = `${SITE_URL}${post.thumbnail}`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
    datePublished: post.date,
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
