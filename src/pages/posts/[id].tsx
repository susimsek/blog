// pages/posts/[id].tsx
import { getAllPostIds, getPostData } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/types/posts'; // type-only import

export async function getStaticProps({ params }: { params: { id: string } }) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Post({ postData }: { postData: Post }) {
  const keywords = [
    postData.title,
    'blog',
    'article',
    'My Blog',
    'programming',
    'technology',
    ...(postData.topics || []),
  ].join(', ');

  return (
    <>
      <Head>
        <title>{postData.title}</title>
        <meta name="description" content={postData.summary} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Şuayb Şimşek" />
      </Head>
      <PostDetail postData={postData} />
    </>
  );
}
