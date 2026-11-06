import type { Metadata } from 'next';
import HomePage from '@/views/HomePage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedHomePageData } from '@/lib/localizedPageData';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['home']);

  return buildPageMetadata({
    locale,
    title: t('home.meta.title', { ns: 'home' }),
    description: t('home.meta.description', { ns: 'home' }),
    keywords: t('home.meta.keywords', { ns: 'home' }),
  });
}

export default async function LocaleHomePage({ params }: Readonly<PageProps<'/[locale]'>>) {
  const { locale } = await params;
  const contentByLocale = await getLocalizedHomePageData();
  const resources = await loadLocaleResources(locale, ['home']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <HomePage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
