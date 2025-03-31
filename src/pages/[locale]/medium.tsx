import { makeMediumPostsProps } from '@/lib/medium';
import { useTranslation } from 'next-i18next';
import { getStaticPaths } from '@/lib/getStatic';
import { SITE_LOGO } from '@/config/constants';
import Layout from '@/components/common/Layout';
import SEO from '@/components/common/SEO';
import { PostSummary } from '@/types/posts';
import PostList from '@/components/posts/PostList';

type MediumPageProps = {
  posts: PostSummary[];
};

export default function MediumPage({ posts }: Readonly<MediumPageProps>) {
  const { t } = useTranslation('medium');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Şuayb Şimşek Medium',
    description: t('medium.meta.description'),
  };

  return (
    <Layout posts={posts} searchEnabled={false} sidebarEnabled={false}>
      <SEO
        type="website"
        title={t('medium.title')}
        ogTitle={t('medium.meta.title')}
        description={t('medium.meta.description')}
        keywords={t('medium.meta.keywords')}
        path="medium"
        image={SITE_LOGO}
        jsonLd={jsonLdData}
      />
      <header className="text-center py-4">
        <h1 className="fw-bold mb-4">{t('medium.header.title')}</h1>
        <p className="text-muted fs-4">{t('medium.header.subtitle')}</p>
      </header>
      <PostList posts={posts} />
    </Layout>
  );
}

const getStaticProps = makeMediumPostsProps(['common', 'medium', 'post', 'topic']);

export { getStaticPaths, getStaticProps };
