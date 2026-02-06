import type { Metadata } from 'next';
import MediumPage from '@/appViews/MediumPage';
import { fetchRssSummaries } from '@/lib/medium';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['medium']);

  return buildPageMetadata({
    locale,
    title: t('medium.meta.title', { ns: 'medium' }),
    description: t('medium.meta.description', { ns: 'medium' }),
    keywords: t('medium.meta.keywords', { ns: 'medium' }),
    path: 'medium',
  });
}

export default async function MediumRoute({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const mediumPosts = await fetchRssSummaries(locale);

  const allPosts = await getSortedPostsData(locale);
  const layoutPosts = getLayoutPosts(allPosts);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);

  return (
    <MediumPage
      mediumPosts={mediumPosts}
      layoutPosts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
    />
  );
}
