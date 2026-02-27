import type { Metadata } from 'next';
import StroopTestPage from '@/views/StroopTestPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

type StroopRouteParams = {
  locale: string;
};

type StroopRouteProps = Readonly<{
  params: Promise<StroopRouteParams>;
}>;

export async function generateMetadata({ params }: StroopRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['games']);

  return buildPageMetadata({
    locale,
    title: t('games.stroop.meta.title', { ns: 'games' }),
    description: t('games.stroop.meta.description', { ns: 'games' }),
    keywords: t('games.stroop.meta.keywords', { ns: 'games' }),
    path: 'games/stroop-test',
    image: '/images/stroop-test-thumbnail.webp',
  });
}

export default async function StroopTestRoute({ params }: StroopRouteProps) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);
  const resources = await loadLocaleResources(locale, ['games']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <StroopTestPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />
    </RouteI18nProvider>
  );
}
