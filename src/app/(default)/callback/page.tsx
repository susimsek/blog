import type { Metadata } from 'next';
import NewsletterCallbackPage from '@/views/NewsletterCallbackPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { defaultLocale } from '@/i18n/settings';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata(): Promise<Metadata> {
  const locale = defaultLocale;
  const { t } = await getServerTranslator(locale, ['common']);

  return buildPageMetadata({
    locale,
    title: t('common.newsletterCallback.meta.title'),
    description: t('common.newsletterCallback.meta.description'),
    path: 'callback',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function NewsletterCallbackRoute() {
  const locale = defaultLocale;
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(locale, ['common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <NewsletterCallbackPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
