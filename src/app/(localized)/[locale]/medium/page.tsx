import type { Metadata } from 'next';
import MediumPage from '@/views/MediumPage';
import { fetchRssSummaries } from '@/lib/medium';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/medium'>): Promise<Metadata> {
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

export default async function MediumRoute({ params }: Readonly<PageProps<'/[locale]/medium'>>) {
  const { locale } = await params;
  const mediumPosts = await fetchRssSummaries(locale);

  const allPosts = await getSortedPostsData(locale);
  const layoutPosts = getLayoutPosts(allPosts);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const resources = await loadLocaleResources(locale, ['medium']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <MediumPage
        mediumPosts={mediumPosts}
        layoutPosts={layoutPosts}
        topics={topics}
        preFooterTopTopics={preFooterTopTopics}
      />
    </RouteI18nProvider>
  );
}
