import type { Metadata } from 'next';
import LocaleNotFoundPage from '@/views/LocaleNotFoundPage';
import { buildNotFoundMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildNotFoundMetadata();

export default async function Localized404Page({ params }: PageProps<'/[locale]/404'>) {
  const { locale } = await params;
  return <LocaleNotFoundPage locale={locale} />;
}
