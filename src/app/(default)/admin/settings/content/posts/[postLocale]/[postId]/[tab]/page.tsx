import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { buildAdminContentPostDetailHref, withAdminLocalePath } from '@/lib/adminRoutes';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostTabRedirectPageProps = {
  params: Promise<{
    postLocale: string;
    postId: string;
    tab: 'metadata' | 'content' | 'comments';
  }>;
};

const POST_EDITOR_TABS = ['metadata', 'content', 'comments'] as const;

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  const params: Array<{ postLocale: string; postId: string; tab: (typeof POST_EDITOR_TABS)[number] }> = [];
  const dedupe = new Set<string>();

  for (const path of postPaths) {
    const postLocale = path.params.locale.trim().toLowerCase();
    const postId = path.params.id.trim();
    if (!postLocale || !postId) {
      continue;
    }

    for (const tab of POST_EDITOR_TABS) {
      const key = `${postLocale}|${postId}|${tab}`;
      if (dedupe.has(key)) {
        continue;
      }

      dedupe.add(key);
      params.push({
        postLocale,
        postId,
        tab,
      });
    }
  }

  return params;
}

export default async function AdminSettingsContentPostTabRedirectPage({
  params,
}: Readonly<AdminSettingsContentPostTabRedirectPageProps>) {
  const { postLocale, postId, tab } = await params;
  redirect(withAdminLocalePath(defaultLocale, buildAdminContentPostDetailHref(postLocale, postId, tab)));
}
