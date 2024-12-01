// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import Head from 'next/head';
import PostDetail from '@/components/PostDetail';
import type { Post } from '@/types/posts'; // type-only import
import Layout from '@/components/Layout';
import { useTranslation } from 'next-i18next';

type PostProps = {
  postData: { [locale: string]: Post };
};

export default function Post({ postData }: PostProps) {
  const { i18n } = useTranslation('post');
  const currentLocale = i18n.language;
  const localizedPost = postData[currentLocale];
  const keywords = [...(localizedPost.topics || [])].join(', ');

  return (
    <Layout>
      <Head>
        <title>{localizedPost.title}</title>
        <meta name="description" content={localizedPost.summary} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Şuayb Şimşek" />
      </Head>
      <PostDetail postData={localizedPost} />
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
