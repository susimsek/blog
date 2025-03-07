import { makePostProps } from '@/lib/posts';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { AUTHOR_NAME, SITE_LOGO, SITE_URL } from '@/config/constants';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import { PostSummary, Topic } from '@/types/posts';
import PostCarousel from '@/components/posts/PostCarousel';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';
import SEO from '@/components/common/SEO';

type HomeProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Home({ posts, topics }: Readonly<HomeProps>) {
  const { t } = useTranslation('home');

  const router = useRouter();

  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('home.meta.title'),
    description: t('home.meta.description'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${currentLocale}/search?q={search_term_string}`,
      },
      'query-input': {
        '@type': 'PropertyValueSpecification',
        valueRequired: true,
        valueName: 'search_term_string',
      },
    },
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <SEO
        type="website"
        title={t('home.title')}
        ogTitle={t('home.meta.title')}
        description={t('home.meta.description')}
        keywords={t('home.meta.keywords')}
        path=""
        image={SITE_LOGO}
        jsonLd={jsonLdData}
      />
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
