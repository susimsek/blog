import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminResetPasswordPage from '@/views/AdminResetPasswordPage';

type AdminResetPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AdminResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-password-reset']);

  return buildPageMetadata({
    locale,
    title: t('adminPasswordReset.reset.meta.title', { ns: 'admin-password-reset' }),
    description: t('adminPasswordReset.reset.meta.description', { ns: 'admin-password-reset' }),
    path: 'admin/reset-password',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminResetPasswordRoute({ params }: Readonly<AdminResetPasswordPageProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-password-reset', 'admin-account']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminResetPasswordPage />
    </RouteI18nProvider>
  );
}
