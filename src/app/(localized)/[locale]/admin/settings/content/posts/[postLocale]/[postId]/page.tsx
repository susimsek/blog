import { locales } from '@/i18n/settings';
import { getAllPostIds } from '@/lib/posts';

type AdminSettingsContentPostRedirectPageProps = {
  params: Promise<{
    locale: string;
    postLocale: string;
    postId: string;
  }>;
};

export async function generateStaticParams() {
  const postPaths = await getAllPostIds();
  const seen = new Set<string>();

  return locales.flatMap(locale =>
    postPaths.flatMap(path => {
      const postLocale = path.params.locale.trim().toLowerCase();
      const postId = path.params.id.trim();
      const key = `${locale}:${postLocale}:${postId}`;

      if (seen.has(key)) {
        return [];
      }

      seen.add(key);
      return {
        locale,
        postLocale,
        postId,
      };
    }),
  );
}

export default async function AdminSettingsContentPostRedirectPage({
  params: _params,
}: Readonly<AdminSettingsContentPostRedirectPageProps>) {
  await _params;
  return null;
}
