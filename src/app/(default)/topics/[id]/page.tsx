import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPage from '@/views/TopicPage';
import { getAllTopicIds, getTopicData } from '@/lib/posts';
import { defaultLocale } from '@/i18n/settings';
import { getServerTranslator } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { getLocalizedTopicPageData } from '@/lib/localizedPageData';

type TopicRouteParams = { id: string };

export async function generateStaticParams(): Promise<TopicRouteParams[]> {
  const paths = await getAllTopicIds();
  return paths.filter(path => path.params.locale === defaultLocale).map(path => ({ id: path.params.id }));
}

export async function generateMetadata({ params }: PageProps<'/topics/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const topic = await getTopicData(defaultLocale, id);
  if (!topic) {
    return buildNotFoundMetadata();
  }

  const { t } = await getServerTranslator(defaultLocale, ['topic']);
  const title = t('topic.title', { ns: 'topic', topic: topic.name });
  const availableLocales = (await getAllTopicIds())
    .filter(topicPath => topicPath.params.id === id)
    .map(topicPath => topicPath.params.locale);

  return buildPageMetadata({
    locale: defaultLocale,
    title,
    description: t('topic.meta.description', { ns: 'topic', topic: topic.name }),
    keywords: t('topic.meta.keywords', { ns: 'topic', topic: topic.name }),
    path: `topics/${id}`,
    availableLocales,
  });
}

export default async function TopicRoute({ params }: Readonly<PageProps<'/topics/[id]'>>) {
  const { id } = await params;
  const contentByLocale = await getLocalizedTopicPageData(id);
  if (!contentByLocale[defaultLocale].topic) {
    notFound();
  }

  return <TopicPage contentByLocale={contentByLocale} />;
}
