import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import '@/styles/global.scss';
import AppProviders from '@/app/providers';
import { layoutNamespaces, locales } from '@/i18n/settings';
import { hasLocale, loadLocaleResources } from '@/i18n/server';
import { getMetadataBase } from '@/lib/metadata';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "Suayb's Blog",
  title: 'Blog',
  description: 'Blog application',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: "Suayb's Blog",
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
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

  const resources = await loadLocaleResources(locale, [...layoutNamespaces]);

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
