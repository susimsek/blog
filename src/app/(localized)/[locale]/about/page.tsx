import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
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

export default async function AboutRoute({ params }: Readonly<PageProps<'/[locale]/about'>>) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);
  const resources = await loadLocaleResources(locale, ['about']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AboutPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />
    </RouteI18nProvider>
  );
}
