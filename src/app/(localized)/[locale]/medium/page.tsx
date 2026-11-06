import type { Metadata } from 'next';
import MediumPage from '@/views/MediumPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedMediumPageData } from '@/lib/localizedPageData';

export async function generateMetadata({ params }: PageProps<'/[locale]/medium'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['medium']);

  return buildPageMetadata({
    locale,
    title: t('medium.meta.title', { ns: 'medium' }),
    description: t('medium.meta.description', { ns: 'medium' }),
    keywords: t('medium.meta.keywords', { ns: 'medium' }),
    path: 'medium',
  });
}

export default async function MediumRoute({ params }: Readonly<PageProps<'/[locale]/medium'>>) {
  const { locale } = await params;
  const contentByLocale = await getLocalizedMediumPageData();
  const resources = await loadLocaleResources(locale, ['medium']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <MediumPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
