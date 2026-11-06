import type { Metadata } from 'next';
import MediumPage from '@/views/MediumPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { defaultLocale } from '@/i18n/settings';
import { getLocalizedMediumPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const locale = defaultLocale;
  const { t } = await getServerTranslator(locale, ['medium']);

  return buildPageMetadata({
    locale,
    title: t('medium.meta.title', { ns: 'medium' }),
    description: t('medium.meta.description', { ns: 'medium' }),
    keywords: t('medium.meta.keywords', { ns: 'medium' }),
    path: 'medium',
  });
}

export default async function MediumRoute() {
  const locale = defaultLocale;
  const contentByLocale = await getLocalizedMediumPageData();
  const resources = await loadLocaleResources(locale, ['medium']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <MediumPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
