import LocaleRedirect from '@/lib/redirect';
import { getAllPostIds } from '@/lib/posts';
import { defaultLocale } from '@/i18n/settings';

export async function generateStaticParams() {
  const paths = await getAllPostIds();
  return paths
    .filter(path => path.params.locale === defaultLocale)
    .map(path => ({
      id: path.params.id,
    }));
}

export default async function PostRedirectPage({ params }: PageProps<'/posts/[id]'>) {
  const { id } = await params;
  return <LocaleRedirect path={`/posts/${id}`} />;
}
