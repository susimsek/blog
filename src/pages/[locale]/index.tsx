import { getSortedPostsData } from '@/lib/posts';
import PostList from '@/components/PostList';
import { Post } from '@/types/posts';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { getStaticPaths, getI18nProps } from '@/lib/getStatic';
import { AUTHOR_NAME } from '@/config/constants';
import { GetStaticPropsContext } from 'next';

type HomeProps = {
  allPostsData: Post[];
};

export default function Home({ allPostsData }: HomeProps) {
  const { t } = useTranslation('home');

  return (
    <>
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
        <PostList posts={allPostsData} />
      </div>
    </>
  );
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const allPostsData: Post[] = getSortedPostsData();

  const i18nProps = await getI18nProps(context, ['common', 'home', 'post']);
  return {
    props: {
      ...i18nProps,
      allPostsData,
    },
  };
};

export { getStaticPaths };
