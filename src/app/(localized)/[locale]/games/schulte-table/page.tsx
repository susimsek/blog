import type { Metadata } from 'next';
import SchulteTablePage from '@/views/SchulteTablePage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

type SchulteRouteParams = {
  locale: string;
};

type SchulteRouteProps = Readonly<{
  params: Promise<SchulteRouteParams>;
}>;

export async function generateMetadata({ params }: SchulteRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['games']);

  return buildPageMetadata({
    locale,
    title: t('games.schulte.meta.title', { ns: 'games' }),
    description: t('games.schulte.meta.description', { ns: 'games' }),
    keywords: t('games.schulte.meta.keywords', { ns: 'games' }),
    path: 'games/schulte-table',
    image: '/images/schulte-table-thumbnail.webp',
  });
}

export default async function SchulteTableRoute({ params }: SchulteRouteProps) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);
  const resources = await loadLocaleResources(locale, ['games']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <SchulteTablePage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />
    </RouteI18nProvider>
  );
}
