import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPage from '@/views/TopicPage';
import { getAllTopicIds, getTopicData } from '@/lib/posts';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getLocalizedTopicPageData } from '@/lib/localizedPageData';

export async function generateStaticParams() {
  const paths = await getAllTopicIds();
  return paths
    .filter(path => path.params.locale !== defaultLocale)
    .map(path => ({
      locale: path.params.locale,
      id: path.params.id,
    }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/topics/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  const topic = await getTopicData(locale, id);
  if (!topic) {
    return buildNotFoundMetadata();
  }

  const { t } = await getServerTranslator(locale, ['topic']);
  const title = t('topic.title', { ns: 'topic', topic: topic.name });
  const availableLocales = (await getAllTopicIds())
    .filter(topicPath => topicPath.params.id === id)
    .map(topicPath => topicPath.params.locale);

  return buildPageMetadata({
    locale,
    title,
    description: t('topic.meta.description', { ns: 'topic', topic: topic.name }),
    keywords: t('topic.meta.keywords', { ns: 'topic', topic: topic.name }),
    path: `topics/${id}`,
    availableLocales,
  });
}

export default async function TopicRoute({ params }: Readonly<PageProps<'/[locale]/topics/[id]'>>) {
  const { locale, id } = await params;
  const contentByLocale = await getLocalizedTopicPageData(id);
  if (!isSupportedLocale(locale) || !contentByLocale[locale]?.topic) notFound();
  const resources = await loadLocaleResources(locale, ['topic']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <TopicPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
