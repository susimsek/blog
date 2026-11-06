import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPage from '@/views/CategoryPage';
import { getAllCategoryIds, getCategoryData } from '@/lib/posts';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildNotFoundMetadata, buildPageMetadata } from '@/lib/metadata';
import { defaultLocale, isSupportedLocale } from '@/i18n/settings';
import { getLocalizedCategoryPageData } from '@/lib/localizedPageData';

export async function generateStaticParams() {
  const paths = await getAllCategoryIds();
  return paths
    .filter(path => path.params.locale !== defaultLocale)
    .map(path => ({
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
  const availableLocales = (await getAllCategoryIds())
    .filter(categoryPath => categoryPath.params.id === id)
    .map(categoryPath => categoryPath.params.locale);

  return buildPageMetadata({
    locale,
    title,
    description: t('category.meta.description', { ns: 'category', category: category.name }),
    keywords: t('category.meta.keywords', { ns: 'category', category: category.name }),
    path: `categories/${id}`,
    availableLocales,
  });
}

export default async function CategoryRoute({ params }: Readonly<PageProps<'/[locale]/categories/[id]'>>) {
  const { locale, id } = await params;
  const contentByLocale = await getLocalizedCategoryPageData(id);
  if (!isSupportedLocale(locale) || !contentByLocale[locale]?.category) notFound();
  const resources = await loadLocaleResources(locale, ['category']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <CategoryPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
