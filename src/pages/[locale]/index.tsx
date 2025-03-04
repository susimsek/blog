import { makePostProps } from '@/lib/posts';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { AUTHOR_NAME, SITE_URL } from '@/config/constants';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import { PostSummary, Topic } from '@/types/posts';
import PostCarousel from '@/components/posts/PostCarousel';

type HomeProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Home({ posts, topics }: Readonly<HomeProps>) {
  const { t } = useTranslation('home');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    headline: t('home.header.title'),
    description: t('home.meta.description'),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
    url: SITE_URL,
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('home.title')}</title>
        <meta name="description" content={t('home.meta.description')} />
        <meta name="keywords" content={t('home.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />
      </Head>
      <header className="text-center py-4">
        <h1 className="fw-bold mb-4">{t('home.header.title')}</h1>
        <p className="text-muted fs-4">{t('home.header.subtitle')}</p>
      </header>
      <PostCarousel posts={posts.slice(0, 3)} />
      <PostList posts={posts} topics={topics} />
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'home', 'post', 'topic']);

export { getStaticPaths, getStaticProps };
