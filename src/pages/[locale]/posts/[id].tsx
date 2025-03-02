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

type PostProps = {
  post: Post;
  posts: PostSummary[];
};

export default function Post({ post, posts }: Readonly<PostProps>) {
  const router = useRouter();

  const { t } = useTranslation('post');

  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');

  const localizedUrl = `${SITE_URL}/${currentLocale}/posts/${post.id}`;
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
    url: localizedUrl,
  };

  return (
    <Layout posts={posts} searchEnabled={true}>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.summary} />
        <link rel="canonical" href={localizedUrl} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        {/* Open Graph meta tags for social media sharing */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={localizedUrl} />
        <meta property="og:site_name" content={t('common:common.siteName')} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale" content={LOCALES[currentLocale]?.ogLocale} />

        <meta property="article:published_time" content={post.date} />
        <meta property="article:modified_time" content={post.date} />
        <meta property="article:author" content={AUTHOR_NAME} />
        {(post.topics ?? []).map(topic => (
          <meta key={topic.name} property="article:tag" content={topic.name} />
        ))}

        {/* Twitter Card meta tags for sharing on Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.summary} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:creator" content={TWITTER_USERNAME} />
        <meta name="twitter:site" content={TWITTER_USERNAME} />

        {/* JSON-LD structured data for enhanced search result features */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
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
