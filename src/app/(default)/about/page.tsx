import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { defaultLocale } from '@/i18n/settings';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const locale = defaultLocale;
  const { t } = await getServerTranslator(locale, ['about']);

  return buildPageMetadata({
    locale,
    title: t('about.meta.title', { ns: 'about' }),
    description: t('about.meta.description', { ns: 'about' }),
    keywords: t('about.meta.keywords', { ns: 'about' }),
    path: 'about',
  });
}

export default async function AboutRoute() {
  const locale = defaultLocale;
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(locale, ['about']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AboutPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
