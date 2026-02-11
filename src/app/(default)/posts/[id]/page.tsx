import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
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

export default async function PostRedirectPage({ params }: Readonly<PageProps<'/posts/[id]'>>) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={`/posts/${id}`} />
    </Suspense>
  );
}
