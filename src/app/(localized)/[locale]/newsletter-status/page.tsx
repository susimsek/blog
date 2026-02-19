import type { Metadata } from 'next';
import NewsletterStatusPage from '@/views/NewsletterStatusPage';
import { getAllTopics, getLayoutPosts, getSortedPostsData, getTopTopicsFromPosts } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/newsletter-status'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['common']);

  return buildPageMetadata({
    locale,
    title: t('common.newsletterStatus.meta.title'),
    description: t('common.newsletterStatus.meta.description'),
    path: 'newsletter-status',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function NewsletterStatusRoute({ params }: Readonly<PageProps<'/[locale]/newsletter-status'>>) {
  const { locale } = await params;

  const allPosts = await getSortedPostsData(locale);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const layoutPosts = getLayoutPosts(allPosts);
  const resources = await loadLocaleResources(locale, ['common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <NewsletterStatusPage
        locale={locale}
        layoutPosts={layoutPosts}
        topics={topics}
        preFooterTopTopics={preFooterTopTopics}
      />
    </RouteI18nProvider>
  );
}
