import type { Metadata } from 'next';
import SearchPage from '@/views/SearchPage';
import { getAllTopics } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/search'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['search']);

  return buildPageMetadata({
    locale,
    title: t('search.title', { ns: 'search' }),
    description: t('search.meta.description', { ns: 'search', query: '' }),
    keywords: t('search.meta.keywords', { ns: 'search', query: '' }),
    path: 'search',
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default async function SearchRoute({ params }: Readonly<PageProps<'/[locale]/search'>>) {
  const { locale } = await params;

  const topics = await getAllTopics(locale);
  const resources = await loadLocaleResources(locale, ['search']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <SearchPage topics={topics} />
    </RouteI18nProvider>
  );
}
