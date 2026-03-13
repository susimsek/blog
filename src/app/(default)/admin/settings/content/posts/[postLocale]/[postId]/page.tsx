import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { buildAdminContentPostDetailRoute, withAdminLocalePath } from '@/lib/adminRoutes';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostRedirectPageProps = {
  params: Promise<{
    postLocale: string;
    postId: string;
  }>;
};

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  const params: Array<{ postLocale: string; postId: string }> = [];
  const dedupe = new Set<string>();

  for (const path of postPaths) {
    const postLocale = path.params.locale.trim().toLowerCase();
    const postId = path.params.id.trim();
    if (!postLocale || !postId) {
      continue;
    }
    const key = `${postLocale}|${postId}`;
    if (dedupe.has(key)) {
      continue;
    }
    dedupe.add(key);
    params.push({
      postLocale,
      postId,
    });
  }

  return params;
}

export default async function AdminSettingsContentPostRedirectPage({
  params,
}: Readonly<AdminSettingsContentPostRedirectPageProps>) {
  const { postLocale, postId } = await params;
  redirect(withAdminLocalePath(defaultLocale, buildAdminContentPostDetailRoute(postLocale, postId)));
}
