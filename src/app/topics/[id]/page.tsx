import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { getAllTopicIds } from '@/lib/posts';
import { defaultLocale } from '@/i18n/settings';

export async function generateStaticParams() {
  const paths = await getAllTopicIds();
  return paths
    .filter(path => path.params.locale === defaultLocale)
    .map(path => ({
      id: path.params.id,
    }));
}

export default async function TopicRedirectPage({ params }: PageProps<'/topics/[id]'>) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={`/topics/${id}`} />
    </Suspense>
  );
}
