import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TopicPage from '@/views/TopicPage';
import {
  getAllTopicIds,
  getAllTopics,
  getLayoutPosts,
  getSortedPostsData,
  getTopTopicsFromPosts,
  getTopicData,
} from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
  const paths = await getAllTopicIds();
  return paths.map(path => ({
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

  return buildPageMetadata({
    locale,
    title,
    description: t('topic.meta.description', { ns: 'topic', topic: topic.name }),
    keywords: t('topic.meta.keywords', { ns: 'topic', topic: topic.name }),
    path: `topics/${id}`,
  });
}

export default async function TopicRoute({ params }: Readonly<PageProps<'/[locale]/topics/[id]'>>) {
  const { locale, id } = await params;

  const topic = await getTopicData(locale, id);
  if (!topic) {
    notFound();
  }

  const allPosts = await getSortedPostsData(locale);
  const posts = allPosts.filter(post => Array.isArray(post.topics) && post.topics.some(t => t.id === id));
  const layoutPosts = getLayoutPosts(allPosts);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);

  return (
    <TopicPage
      topic={topic}
      posts={posts}
      layoutPosts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
    />
  );
}
