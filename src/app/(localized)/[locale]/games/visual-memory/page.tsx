import type { Metadata } from 'next';
import VisualMemoryPage from '@/views/VisualMemoryPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

type VisualMemoryRouteParams = {
  locale: string;
};

type VisualMemoryRouteProps = Readonly<{
  params: Promise<VisualMemoryRouteParams>;
}>;

export async function generateMetadata({ params }: VisualMemoryRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['games']);

  return buildPageMetadata({
    locale,
    title: t('games.visualMemory.meta.title', { ns: 'games' }),
    description: t('games.visualMemory.meta.description', { ns: 'games' }),
    keywords: t('games.visualMemory.meta.keywords', { ns: 'games' }),
    path: 'games/visual-memory',
    image: '/images/visual-memory-thumbnail.webp',
  });
}

export default async function VisualMemoryRoute({ params }: VisualMemoryRouteProps) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);
  const resources = await loadLocaleResources(locale, ['games']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <VisualMemoryPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />
    </RouteI18nProvider>
  );
}
