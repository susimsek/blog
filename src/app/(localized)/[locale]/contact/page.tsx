import type { Metadata } from 'next';
import ContactPage from '@/views/ContactPage';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getLocalizedLayoutPageData } from '@/lib/localizedPageData';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['contact']);

  return buildPageMetadata({
    locale,
    title: t('contact.meta.title', { ns: 'contact' }),
    description: t('contact.meta.description', { ns: 'contact' }),
    keywords: t('contact.meta.keywords', { ns: 'contact' }),
    path: 'contact',
  });
}

export default async function ContactRoute({ params }: Readonly<PageProps<'/[locale]/contact'>>) {
  const { locale } = await params;
  const contentByLocale = await getLocalizedLayoutPageData();
  const resources = await loadLocaleResources(locale, ['contact']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <ContactPage contentByLocale={contentByLocale} />
    </RouteI18nProvider>
  );
}
