import type { Metadata } from 'next';
import AboutPage from '@/appViews/AboutPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['about']);

  return buildPageMetadata({
    locale,
    title: t('about.meta.title', { ns: 'about' }),
    description: t('about.meta.description', { ns: 'about' }),
    keywords: t('about.meta.keywords', { ns: 'about' }),
    path: 'about',
  });
}

export default async function AboutRoute({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);

  return <AboutPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />;
}
