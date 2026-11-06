import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerTranslator } from '@/i18n/server';
import { defaultLocale, locales } from '@/i18n/settings';
import { buildPageMetadata } from '@/lib/metadata';
import { buildAdminContentPostDetailHref } from '@/lib/adminRoutes';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostTabPageProps = {
  params: Promise<{
    postLocale: string;
    postId: string;
    tab: 'metadata' | 'content' | 'comments';
  }>;
};

const POST_EDITOR_TABS = ['metadata', 'content', 'comments'] as const;

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  return locales.flatMap(postLocale =>
    postPaths.flatMap(path =>
      POST_EDITOR_TABS.map(tab => ({
        postLocale,
        postId: path.params.id,
        tab,
      })),
    ),
  );
}

export async function generateMetadata({ params }: AdminSettingsContentPostTabPageProps): Promise<Metadata> {
  const { postLocale, postId, tab } = await params;
  const { t } = await getServerTranslator(defaultLocale, ['admin-account']);

  return buildPageMetadata({
    locale: defaultLocale,
    title: t('adminAccount.meta.title', { ns: 'admin-account' }),
    description: t('adminAccount.meta.description', { ns: 'admin-account' }),
    path: `admin/settings/content/posts/${postLocale}/${postId}/${tab}`,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function AdminSettingsContentPostTabRoute({
  params,
}: Readonly<AdminSettingsContentPostTabPageProps>) {
  const { postLocale, postId, tab } = await params;
  redirect(buildAdminContentPostDetailHref(postLocale, postId, tab));
}
