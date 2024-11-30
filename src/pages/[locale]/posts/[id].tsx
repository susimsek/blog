import { getAllPostIds, getPostData } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/types/posts'; // type-only import
import { getI18nProps } from '@/lib/getStatic';

export const getStaticProps = async ({ params, locale }: { params: { id: string }; locale: string }) => {
  const postData = await getPostData(params.id);

  const i18nProps = await getI18nProps({ locale }, ['common', 'post']);
  return {
    props: {
      ...i18nProps,
      postData,
    },
  };
};

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Post({ postData }: { postData: Post }) {
  const keywords = [...(postData.topics || [])].join(', ');

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
