import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import '@/styles/global.scss';
import AppProviders from '@/app/providers';
import { allNamespaces, locales } from '@/i18n/settings';
import { hasLocale, loadLocaleResources } from '@/i18n/server';
import { getMetadataBase } from '@/lib/metadata';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Blog',
  description: 'Blog application',
};

export const dynamic = 'error';
export const dynamicParams = false;

export async function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  const resources = await loadLocaleResources(locale, allNamespaces);

  return (
    <html lang={locale}>
      <body>
        <AppProviders locale={locale} resources={resources}>
          <Suspense fallback={null}>{children}</Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
