import type { Metadata } from 'next';
import '@/styles/global.scss';
import { getMetadataBase } from '@/lib/metadata';
import { defaultLocale } from '@/i18n/settings';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Blog',
  description: 'Blog application',
};

export default function DefaultRootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
