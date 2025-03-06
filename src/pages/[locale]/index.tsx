import { makePostProps } from '@/lib/posts';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { AUTHOR_NAME, LOCALES, SITE_LOGO, SITE_URL, TWITTER_USERNAME } from '@/config/constants';
import Layout from '@/components/common/Layout';
import PostList from '@/components/posts/PostList';
import { PostSummary, Topic } from '@/types/posts';
import PostCarousel from '@/components/posts/PostCarousel';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';

type HomeProps = {
  posts: PostSummary[];
  topics: Topic[];
};

export default function Home({ posts, topics }: Readonly<HomeProps>) {
  const { t } = useTranslation('home');

  const router = useRouter();

  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const localizedUrl = `${SITE_URL}/${currentLocale}`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    headline: t('home.header.title'),
    description: t('home.meta.description'),
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
    },
    url: localizedUrl,
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Head>
        <title>{t('home.title')}</title>
        <meta name="description" content={t('home.meta.description')} />
        <link rel="canonical" href={localizedUrl} />
        <meta name="keywords" content={t('home.meta.keywords')} />
        <meta name="author" content={AUTHOR_NAME} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={t('home.meta.title')} />
        <meta property="og:description" content={t('home.meta.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={localizedUrl} />
        <meta property="og:site_name" content={t('common:common.siteName')} />
        <meta property="og:image" content={SITE_LOGO} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:locale" content={LOCALES[currentLocale]?.ogLocale} />

        {/* Twitter Card meta tags for sharing on Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content={TWITTER_USERNAME} />
        <meta name="twitter:site" content={TWITTER_USERNAME} />

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
