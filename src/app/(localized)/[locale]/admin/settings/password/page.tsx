import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerTranslator } from '@/i18n/server';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';
import { buildPageMetadata } from '@/lib/metadata';

type AdminSettingsPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AdminSettingsPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-account']);

  return buildPageMetadata({
    locale,
    title: t('adminAccount.meta.title', { ns: 'admin-account' }),
    description: t('adminAccount.meta.description', { ns: 'admin-account' }),
    path: 'admin/settings/security',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminSettingsPasswordRoute({ params }: Readonly<AdminSettingsPasswordPageProps>) {
  const { locale } = await params;
  redirect(withAdminLocalePath(locale, ADMIN_ROUTES.settings.security));
}
