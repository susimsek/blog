import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPage from '@/views/CategoryPage';
import {
  getAllCategoryIds,
  getAllTopics,
  getCategoryData,
  getLayoutPosts,
  getSortedPostsData,
  getTopTopicsFromPosts,
} from '@/lib/posts';
import { getServerTranslator } from '@/i18n/server';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { loadLocaleResources } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
  const paths = await getAllCategoryIds();
  return paths.map(path => ({
    locale: path.params.locale,
    id: path.params.id,
  }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/categories/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  const category = await getCategoryData(locale, id);
  if (!category) {
    return buildNotFoundMetadata();
  }

  const { t } = await getServerTranslator(locale, ['category']);
  const title = t('category.title', { ns: 'category', category: category.name });

  return buildPageMetadata({
    locale,
    title,
    description: t('category.meta.description', { ns: 'category', category: category.name }),
    keywords: t('category.meta.keywords', { ns: 'category', category: category.name }),
    path: `categories/${id}`,
  });
}

export default async function CategoryRoute({ params }: Readonly<PageProps<'/[locale]/categories/[id]'>>) {
  const { locale, id } = await params;

  const category = await getCategoryData(locale, id);
  if (!category) {
    notFound();
  }

  const allPosts = await getSortedPostsData(locale);
  const posts = allPosts.filter(post => post.category?.id.trim().toLowerCase() === id);
  const layoutPosts = getLayoutPosts(allPosts);
  const topics = await getAllTopics(locale);
  const preFooterTopTopics = getTopTopicsFromPosts(allPosts, topics);
  const resources = await loadLocaleResources(locale, ['category']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <CategoryPage
        locale={locale}
        category={category}
        posts={posts}
        layoutPosts={layoutPosts}
        topics={topics}
        preFooterTopTopics={preFooterTopTopics}
      />
    </RouteI18nProvider>
  );
}
