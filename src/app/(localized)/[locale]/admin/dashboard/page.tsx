import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminDashboardPage from '@/views/AdminDashboardPage';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/dashboard'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-dashboard']);

  return buildPageMetadata({
    locale,
    title: t('adminDashboard.meta.title', { ns: 'admin-dashboard' }),
    description: t('adminDashboard.meta.description', { ns: 'admin-dashboard' }),
    path: 'admin/dashboard',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminDashboardRoute({ params }: Readonly<PageProps<'/[locale]/admin/dashboard'>>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-dashboard']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminDashboardPage />
    </RouteI18nProvider>
  );
}
