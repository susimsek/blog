import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import '@/styles/global.scss';
import AppProviders from '@/app/providers';
import { allNamespaces, defaultLocale } from '@/i18n/settings';
import { loadLocaleResources } from '@/i18n/server';
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

export default async function SiteLayout({ children }: Readonly<LayoutProps<'/'>>) {
  const resources = await loadLocaleResources(defaultLocale, [...allNamespaces]);

  return (
    <html lang={defaultLocale}>
      <body>
        <AppProviders locale={defaultLocale} resources={resources}>
          <Suspense fallback={null}>{children}</Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
