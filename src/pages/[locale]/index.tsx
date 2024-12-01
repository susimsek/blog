// pages/index.tsx
import { makePostProps } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { AUTHOR_NAME } from '@/config/constants';
import Layout from '@/components/Layout';

type HomeProps = {
  posts: Post[];
};

export default function Home({ posts }: HomeProps) {
  const { t } = useTranslation('home');

  return (
    <Layout>
      <Head>
        <title>{t('home.title')}</title>
        <meta name="description" content={t('home.meta.description')} />
        <meta name="keywords" content={t('home.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
      </Head>
      <div>
        <header className="text-center py-5">
          <h1 className="fw-bold mb-4">{t('home.header.title')}</h1>
          <p className="text-muted fs-5">{t('home.header.subtitle')}</p>
        </header>
        <PostList posts={posts} />
      </div>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'home', 'post']);

export { getStaticPaths, getStaticProps };
