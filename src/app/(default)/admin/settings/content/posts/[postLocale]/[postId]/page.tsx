import { locales } from '@/i18n/settings';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostRedirectPageProps = {
  params: Promise<{
    postLocale: string;
    postId: string;
  }>;
};

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  return locales.flatMap(postLocale =>
    postPaths.map(path => ({
      postLocale,
      postId: path.params.id,
    })),
  );
}

export default async function AdminSettingsContentPostRedirectPage({
  params: _params,
}: Readonly<AdminSettingsContentPostRedirectPageProps>) {
  await _params;
  return null;
}
