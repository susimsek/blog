import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPage from '@/views/CategoryPage';
import { getAllCategoryIds, getCategoryData } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { defaultLocale } from '@/i18n/settings';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { getLocalizedCategoryPageData } from '@/lib/localizedPageData';

type CategoryRouteParams = { id: string };

export async function generateStaticParams(): Promise<CategoryRouteParams[]> {
  const paths = await getAllCategoryIds();
  return paths.filter(path => path.params.locale === defaultLocale).map(path => ({ id: path.params.id }));
}

export async function generateMetadata({ params }: PageProps<'/categories/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategoryData(defaultLocale, id);
  if (!category) {
    return buildNotFoundMetadata();
  }

  const { t } = await getServerTranslator(defaultLocale, ['category']);
  const title = t('category.title', { ns: 'category', category: category.name });
  const availableLocales = (await getAllCategoryIds())
    .filter(categoryPath => categoryPath.params.id === id)
    .map(categoryPath => categoryPath.params.locale);

  return buildPageMetadata({
    locale: defaultLocale,
    title,
    description: t('category.meta.description', { ns: 'category', category: category.name }),
    keywords: t('category.meta.keywords', { ns: 'category', category: category.name }),
    path: `categories/${id}`,
    availableLocales,
  });
}

export default async function CategoryRoute({ params }: Readonly<PageProps<'/categories/[id]'>>) {
  const { id } = await params;
  const contentByLocale = await getLocalizedCategoryPageData(id);
  if (!contentByLocale[defaultLocale].category) {
    notFound();
  }
  const resources = await loadLocaleResources(defaultLocale, ['category']);

  return (
    <RouteI18nProvider locale={defaultLocale} resources={resources}>
      <CategoryPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
