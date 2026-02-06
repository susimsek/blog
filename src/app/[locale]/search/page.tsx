import type { Metadata } from 'next';
import SearchPage from '@/appViews/SearchPage';
import { getAllTopics, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
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

export default async function SearchRoute({ params }: PageProps<'/[locale]/search'>) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);

  return <SearchPage allPosts={allPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />;
}
