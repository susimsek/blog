import type { Metadata } from 'next';
import '@/styles/global.scss';
import { getMetadataBase } from '@/lib/metadata';
import i18nextConfig from '@/i18n/settings';

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Blog',
  description: 'Blog application',
};

const localePattern = i18nextConfig.i18n.locales.map(locale => locale.replaceAll('-', '\\-')).join('|');
const syncHtmlLangScript = `(function(){var m=window.location.pathname.match(new RegExp('^/(${localePattern})(?:/|$)'));if(m){document.documentElement.lang=m[1];}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={i18nextConfig.i18n.defaultLocale}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: syncHtmlLangScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
