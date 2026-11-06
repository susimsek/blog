import type { Metadata } from 'next';
import SchulteTablePage from '@/views/SchulteTablePage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { defaultLocale } from '@/i18n/settings';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator(defaultLocale, ['games']);
  return buildPageMetadata({
    locale: defaultLocale,
    title: t('games.schulte.meta.title', { ns: 'games' }),
    description: t('games.schulte.meta.description', { ns: 'games' }),
    keywords: t('games.schulte.meta.keywords', { ns: 'games' }),
    path: 'games/schulte-table',
    image: '/images/schulte-table-thumbnail.webp',
  });
}

export default async function SchulteTableRoute() {
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(defaultLocale, ['games']);
  return (
    <RouteI18nProvider locale={defaultLocale} resources={resources}>
      <SchulteTablePage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
