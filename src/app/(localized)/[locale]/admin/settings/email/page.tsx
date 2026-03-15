import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminAccountPage from '@/views/AdminAccountPage';

type AdminSettingsEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AdminSettingsEmailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-account']);

  return buildPageMetadata({
    locale,
    title: t('adminAccount.meta.title', { ns: 'admin-account' }),
    description: t('adminAccount.meta.description', { ns: 'admin-account' }),
    path: 'admin/settings/email',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminSettingsEmailRoute({ params }: Readonly<AdminSettingsEmailPageProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-account', 'admin-common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminAccountPage section="email" />
    </RouteI18nProvider>
  );
}
