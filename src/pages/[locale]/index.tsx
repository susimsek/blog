import { makePostProps } from '@/lib/posts';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { AUTHOR_NAME } from '@/config/constants';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import { PostSummary, Topic } from '@/types/posts';
import PostCarousel from '@/components/posts/PostCarousel';
import { Container } from 'react-bootstrap';

type HomeProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Home({ posts, topics }: Readonly<HomeProps>) {
  const { t } = useTranslation('home');

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true}>
      <Head>
        <title>{t('home.title')}</title>
        <meta name="description" content={t('home.meta.description')} />
        <meta name="keywords" content={t('home.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
      </Head>
      <Container>
        <header className="text-center py-4">
          <h1 className="fw-bold mb-4">{t('home.header.title')}</h1>
          <p className="text-muted fs-4">{t('home.header.subtitle')}</p>
        </header>

        <PostCarousel posts={posts.slice(0, 3)} />

        <PostList posts={posts} topics={topics} />
      </Container>
    </Layout>
  );
}

const getStaticProps = makePostProps(['common', 'home', 'post', 'topic']);

export { getStaticPaths, getStaticProps };
