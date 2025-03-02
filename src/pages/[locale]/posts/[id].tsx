// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, LOCALES, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../../next-i18next.config';
import { NextSeo } from 'next-seo';
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

  const url = `${SITE_URL}/posts/${post.id}`;
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
    url: url,
  };

  return (
    <Layout posts={posts} searchEnabled={true}>
      <NextSeo
        title={post.title}
        description={post.summary}
        canonical={url}
        openGraph={{
          type: 'article',
          url: url,
          title: post.title,
          description: post.summary,
          images: [{ url: image, width: 800, height: 600, alt: post.title }],
          locale: LOCALES[currentLocale]?.ogLocale as string,
          siteName: t('common:common.siteName'),
          article: {
            publishedTime: post.date,
            authors: [AUTHOR_NAME],
            tags: post.topics?.map(topic => topic.name) ?? [],
          },
        }}
        twitter={{
          cardType: 'summary_large_image',
          site: SITE_URL,
          handle: TWITTER_USERNAME,
        }}
        additionalMetaTags={[
          { name: 'keywords', content: keywords },
          { name: 'author', content: AUTHOR_NAME },
          { name: 'robots', content: 'index, follow' },
        ]}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />

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
