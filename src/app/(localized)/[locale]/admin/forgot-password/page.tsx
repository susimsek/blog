import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import AdminForgotPasswordPage from '@/views/AdminForgotPasswordPage';

type AdminForgotPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AdminForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-password-reset']);

  return buildPageMetadata({
    locale,
    title: t('adminPasswordReset.request.meta.title', { ns: 'admin-password-reset' }),
    description: t('adminPasswordReset.request.meta.description', { ns: 'admin-password-reset' }),
    path: 'admin/forgot-password',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminForgotPasswordRoute({ params }: Readonly<AdminForgotPasswordPageProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-password-reset']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminForgotPasswordPage />
    </RouteI18nProvider>
  );
}
