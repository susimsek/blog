import type { Metadata } from 'next';
import NewsletterCallbackPage from '@/views/NewsletterCallbackPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata({ params }: PageProps<'/[locale]/callback'>): Promise<Metadata> {
  const { locale } = await params;
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

export default async function NewsletterCallbackRoute({ params }: Readonly<PageProps<'/[locale]/callback'>>) {
  const { locale } = await params;
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(locale, ['common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <NewsletterCallbackPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
