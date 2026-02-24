import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { getAllCategoryIds } from '@/lib/posts';
import { defaultLocale } from '@/i18n/settings';

export async function generateStaticParams() {
  const paths = await getAllCategoryIds();
  return paths
    .filter(path => path.params.locale === defaultLocale)
    .map(path => ({
      id: path.params.id,
    }));
}

export default async function CategoryRedirectPage({ params }: Readonly<PageProps<'/categories/[id]'>>) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={`/categories/${id}`} />
    </Suspense>
  );
}
