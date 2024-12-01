// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/types/posts'; // type-only import
import Layout from '@/components/Layout';
import { useTranslation } from 'next-i18next';

type PostProps = {
  post: Post;
};

export default function Post({ post }: PostProps) {
  const keywords = [...(post.topics || [])].join(', ');

  return (
    <Layout>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.summary} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Şuayb Şimşek" />
      </Head>
      <PostDetail postData={post} />
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
