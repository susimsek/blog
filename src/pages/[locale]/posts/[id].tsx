// pages/posts/[id].tsx
import { getAllPostIds, makePostDetailProps } from '@/lib/posts';
import React from 'react';
import PostDetail from '@/components/posts/PostDetail';
import type { Post, PostSummary } from '@/types/posts'; // type-only import
import Layout from '@/components/common/Layout';
import { AUTHOR_NAME, SITE_LOGO, SITE_URL, assetPrefix } from '@/config/constants';
import SEO from '@/components/common/SEO';
import { getRelatedPosts } from '@/lib/postFilters';
import type { GetStaticProps, GetStaticPropsContext } from 'next';
import i18nextConfig from '@root/next-i18next.config';

type PostProps = {
  post: Post;
  posts?: PostSummary[];
  locale: string;
};

export default function Post({ post, posts = [], locale }: Readonly<PostProps>) {
  const keywords = (post.topics ?? []).map(topic => topic.name).join(', ');
  const relatedPosts = getRelatedPosts(post, posts, 3);

  const logoUrl = (() => {
    try {
      return new URL(SITE_LOGO, SITE_URL).toString();
    } catch {
      return `${SITE_URL}${SITE_LOGO}`;
    }
  })();

  const imageUrl = (() => {
    if (!post.thumbnail) {
      return null;
    }
    const imageBase = assetPrefix && /^https?:\/\//.test(assetPrefix) ? assetPrefix : SITE_URL;
    try {
      return new URL(post.thumbnail, imageBase).toString();
    } catch {
      return `${imageBase}${post.thumbnail}`;
    }
  })();

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    inLanguage: locale,
    ...(imageUrl
      ? {
          image: {
            '@type': 'ImageObject',
            url: imageUrl,
            width: 1200,
            height: 630,
          },
        }
      : {}),
    dateCreated: post.date,
    datePublished: post.date,
    dateModified: post.date,
    headline: post.title,
    keywords: keywords,
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
        url: logoUrl,
        width: 1200,
        height: 630,
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
        image={imageUrl ?? undefined}
        type="article"
        path={`/posts/${post.id}`}
        article={articleData}
        jsonLd={jsonLdData}
      />
      <PostDetail post={post} relatedPosts={relatedPosts} />
    </Layout>
  );
}

const getStaticProps: GetStaticProps<PostProps> = async (context: GetStaticPropsContext) => {
  const locale = (context?.params?.locale as string) || i18nextConfig.i18n.defaultLocale;
  const base = await makePostDetailProps(['common', 'post'])(context);

  if ('props' in base) {
    return {
      ...base,
      props: {
        ...(base.props as Omit<PostProps, 'locale'>),
        locale,
      },
    };
  }

  if ('redirect' in base) {
    return base;
  }

  return { notFound: true };
};

async function getStaticPaths() {
  const paths = await getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export { getStaticPaths, getStaticProps };
