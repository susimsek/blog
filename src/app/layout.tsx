import type { Metadata } from 'next';
import '@/styles/global.scss';
import { getMetadataBase } from '@/lib/metadata';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Blog',
  description: 'Blog application',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
