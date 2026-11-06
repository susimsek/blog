import type { Metadata } from 'next';
import VisualMemoryPage from '@/views/VisualMemoryPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { defaultLocale } from '@/i18n/settings';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator(defaultLocale, ['games']);
  return buildPageMetadata({
    locale: defaultLocale,
    title: t('games.visualMemory.meta.title', { ns: 'games' }),
    description: t('games.visualMemory.meta.description', { ns: 'games' }),
    keywords: t('games.visualMemory.meta.keywords', { ns: 'games' }),
    path: 'games/visual-memory',
    image: '/images/visual-memory-thumbnail.webp',
  });
}

export default async function VisualMemoryRoute() {
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(defaultLocale, ['games']);
  return (
    <RouteI18nProvider locale={defaultLocale} resources={resources}>
      <VisualMemoryPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
