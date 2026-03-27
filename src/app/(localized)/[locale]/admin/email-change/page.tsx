import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminEmailChangePage from '@/views/AdminEmailChangePage';

type AdminEmailChangeRouteProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AdminEmailChangeRouteProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-email-change']);

  return buildPageMetadata({
    locale,
    title: t('adminEmailChange.meta.title', { ns: 'admin-email-change' }),
    description: t('adminEmailChange.meta.description', { ns: 'admin-email-change' }),
    path: 'admin/email-change',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminEmailChangeRoute({ params }: Readonly<AdminEmailChangeRouteProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-email-change']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminEmailChangePage />
    </RouteI18nProvider>
  );
}
