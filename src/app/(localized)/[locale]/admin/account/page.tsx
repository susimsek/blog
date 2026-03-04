import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerTranslator } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/account'>): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslator(locale, ['admin-account']);

  return buildPageMetadata({
    locale,
    title: t('adminAccount.meta.title', { ns: 'admin-account' }),
    description: t('adminAccount.meta.description', { ns: 'admin-account' }),
    path: 'admin/change-password',
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminAccountRoute({ params }: Readonly<PageProps<'/[locale]/admin/account'>>) {
  const { locale } = await params;
  redirect(`/${locale}/admin/change-password`);
}
