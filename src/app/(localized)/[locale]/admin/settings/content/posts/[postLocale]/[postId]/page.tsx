import type { Metadata } from 'next';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { getServerTranslator, loadLocaleResources } from '@/i18n/server';
import { buildPageMetadata } from '@/lib/metadata';
import { getAllPostIds } from '@/lib/posts';
import AdminAccountPage from '@/views/AdminAccountPage';

type AdminSettingsContentPostPageProps = {
  params: Promise<{
    locale: string;
    postLocale: string;
    postId: string;
  }>;
};

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  return postPaths.map(path => ({
    locale: path.params.locale.trim().toLowerCase(),
    postLocale: path.params.locale.trim().toLowerCase(),
    postId: path.params.id.trim(),
  }));
}

export async function generateMetadata({ params }: AdminSettingsContentPostPageProps): Promise<Metadata> {
  const { locale, postLocale, postId } = await params;
  const { t } = await getServerTranslator(locale, ['admin-account']);

  return buildPageMetadata({
    locale,
    title: t('adminAccount.meta.title', { ns: 'admin-account' }),
    description: t('adminAccount.meta.description', { ns: 'admin-account' }),
    path: `admin/settings/content/posts/${postLocale}/${postId}`,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminSettingsContentPostRoute({ params }: Readonly<AdminSettingsContentPostPageProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-account', 'admin-common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminAccountPage section="content" />
    </RouteI18nProvider>
  );
}
