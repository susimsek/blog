// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME } from '@/config/constants';

type PostProps = {
  post: Post;
  posts: PostSummary[];
};

export default function Post({ post, posts }: Readonly<PostProps>) {
  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');

  return (
    <Layout posts={posts} searchEnabled={true}>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.summary} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow" />
      </Head>
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
