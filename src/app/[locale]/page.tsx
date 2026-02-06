import type { Metadata } from 'next';
import HomePage from '@/appViews/HomePage';
import { getAllTopics, getSortedPostsData } from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['home']);

  return buildPageMetadata({
    locale,
    title: t('home.meta.title', { ns: 'home' }),
    description: t('home.meta.description', { ns: 'home' }),
    keywords: t('home.meta.keywords', { ns: 'home' }),
  });
}

export default async function LocaleHomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  const posts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);

  return <HomePage posts={posts} topics={topics} locale={locale} />;
}
