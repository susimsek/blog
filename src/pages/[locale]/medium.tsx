import { makeMediumPostsProps } from '@/lib/medium';
import { useTranslation } from 'next-i18next';
import { MEDIUM_LOGO } from '@/config/constants';
import Layout from '@/components/common/Layout';
import Seo from '@/components/common/SEO';
import { PostSummary, Topic } from '@/types/posts';
import PostList from '@/components/posts/PostList';

type MediumPageProps = {
  mediumPosts: PostSummary[];
  posts: PostSummary[];
  topics: Topic[];
};

export default function MediumPage({ posts, topics, mediumPosts }: Readonly<MediumPageProps>) {
  const { t } = useTranslation('medium');

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('medium.meta.title'),
    description: t('medium.meta.description'),
  };

  return (
    <Layout posts={posts} topics={topics} searchEnabled={true} sidebarEnabled={true}>
      <Seo
        type="website"
        title={t('medium.title')}
        ogTitle={t('medium.meta.title')}
        description={t('medium.meta.description')}
        keywords={t('medium.meta.keywords')}
        path="/medium"
        image={MEDIUM_LOGO}
        jsonLd={jsonLdData}
      />
      <header className="text-center py-4">
        <h1 className="fw-bold mb-4">{t('medium.header.title')}</h1>
        <p className="text-muted fs-4">{t('medium.header.subtitle')}</p>
      </header>
      <PostList posts={mediumPosts} />
    </Layout>
  );
}

export const getStaticProps = makeMediumPostsProps(['common', 'medium', 'post', 'topic']);
export { getStaticPaths } from '@/lib/getStatic';
