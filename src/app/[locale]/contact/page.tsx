import type { Metadata } from 'next';
import ContactPage from '@/appViews/ContactPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['contact']);

  return buildPageMetadata({
    locale,
    title: t('contact.meta.title', { ns: 'contact' }),
    description: t('contact.meta.description', { ns: 'contact' }),
    keywords: t('contact.meta.keywords', { ns: 'contact' }),
    path: 'contact',
  });
}

export default async function ContactRoute({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);

  return <ContactPage layoutPosts={layoutPosts} topics={topics} preFooterTopTopics={preFooterTopTopics} />;
}
