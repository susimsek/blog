import type { Metadata } from 'next';
import LocaleNotFoundPage from '@/appViews/LocaleNotFoundPage';
import { buildNotFoundMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildNotFoundMetadata();

export default async function Localized404Page({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return <LocaleNotFoundPage locale={locale} />;
}
