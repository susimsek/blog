import type { Metadata } from 'next';
import SchulteTablePage from '@/views/SchulteTablePage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

type SchulteRouteParams = {
  locale: string;
};

type SchulteRouteProps = Readonly<{
  params: Promise<SchulteRouteParams>;
}>;

export async function generateMetadata({ params }: SchulteRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['games']);

  return buildPageMetadata({
    locale,
    title: t('games.schulte.meta.title', { ns: 'games' }),
    description: t('games.schulte.meta.description', { ns: 'games' }),
    keywords: t('games.schulte.meta.keywords', { ns: 'games' }),
    path: 'games/schulte-table',
    image: '/images/schulte-table-thumbnail.webp',
  });
}

export default async function SchulteTableRoute({ params }: SchulteRouteProps) {
  const { locale } = await params;
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(locale, ['games']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <SchulteTablePage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
