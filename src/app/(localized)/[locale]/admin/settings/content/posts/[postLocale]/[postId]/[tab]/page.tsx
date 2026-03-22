import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerTranslator } from '@/i18n/server';
import { locales } from '@/i18n/settings';
import { buildPageMetadata } from '@/lib/metadata';
import { buildAdminContentPostDetailHref, withAdminLocalePath } from '@/lib/adminRoutes';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostTabPageProps = {
  params: Promise<{
    locale: string;
    postLocale: string;
    postId: string;
    tab: 'metadata' | 'content' | 'comments';
  }>;
};

const POST_EDITOR_TABS = ['metadata', 'content', 'comments'] as const;

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  const seen = new Set<string>();

  return locales.flatMap(locale =>
    postPaths.flatMap(path => {
      const postLocale = path.params.locale.trim().toLowerCase();
      const postId = path.params.id.trim();

      return POST_EDITOR_TABS.flatMap(tab => {
        const key = `${locale}:${postLocale}:${postId}:${tab}`;
        if (seen.has(key)) {
          return [];
        }

        seen.add(key);
        return {
          locale,
          postLocale,
          postId,
          tab,
        };
      });
    }),
  );
}

export async function generateMetadata({ params }: AdminSettingsContentPostTabPageProps): Promise<Metadata> {
  const { locale, postLocale, postId, tab } = await params;
  const { t } = await getServerTranslator(locale, ['admin-account']);

  return buildPageMetadata({
    locale,
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
  const { locale, postLocale, postId, tab } = await params;
  redirect(withAdminLocalePath(locale, buildAdminContentPostDetailHref(postLocale, postId, tab)));
}
