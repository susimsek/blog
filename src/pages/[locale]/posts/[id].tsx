// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/posts/PostDetail';
import type { Post } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';

type PostProps = {
  post: Post;
};

export default function Post({ post }: Readonly<PostProps>) {
  const keywords = [...(post.topics ?? [])].join(', ');

  return (
    <Layout>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.summary} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Şuayb Şimşek" />
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
