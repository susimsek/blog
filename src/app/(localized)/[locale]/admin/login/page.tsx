import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminLoginPage from '@/views/AdminLoginPage';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/login'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-login']);

  return buildPageMetadata({
    locale,
    title: t('adminLogin.meta.title', { ns: 'admin-login' }),
    description: t('adminLogin.meta.description', { ns: 'admin-login' }),
    path: 'admin/login',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminLoginRoute({ params }: Readonly<PageProps<'/[locale]/admin/login'>>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-login']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminLoginPage />
    </RouteI18nProvider>
  );
}
