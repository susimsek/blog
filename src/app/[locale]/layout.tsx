import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AppProviders from '@/app/providers';
import { allNamespaces, locales } from '@/i18n/settings';
import { loadLocaleResources } from '@/i18n/server';

export const dynamic = 'error';
export const dynamicParams = false;

export async function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const resources = await loadLocaleResources(locale, allNamespaces);

  return (
    <AppProviders locale={locale} resources={resources}>
      <Suspense fallback={null}>{children}</Suspense>
    </AppProviders>
  );
}
