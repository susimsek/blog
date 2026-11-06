import type { Metadata } from 'next';
import StroopTestPage from '@/views/StroopTestPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { defaultLocale } from '@/i18n/settings';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslator(defaultLocale, ['games']);
  return buildPageMetadata({
    locale: defaultLocale,
    title: t('games.stroop.meta.title', { ns: 'games' }),
    description: t('games.stroop.meta.description', { ns: 'games' }),
    keywords: t('games.stroop.meta.keywords', { ns: 'games' }),
    path: 'games/stroop-test',
    image: '/images/stroop-test-thumbnail.webp',
  });
}

export default async function StroopTestRoute() {
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(defaultLocale, ['games']);
  return (
    <RouteI18nProvider locale={defaultLocale} resources={resources}>
      <StroopTestPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
