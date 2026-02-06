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
const normalizedBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replaceAll(/^\/+/g, '').replaceAll(/\/+$/g, '');
const syncHtmlLangScript = `(function(){var p=window.location.pathname;var b=${JSON.stringify(normalizedBasePath)};if(b&&p.startsWith('/'+b+'/')){p=p.slice(b.length+1);}var m=p.match(new RegExp('^/(${localePattern})(?:/|$)'));if(m){document.documentElement.lang=m[1];}})();`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={i18nextConfig.i18n.defaultLocale}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: syncHtmlLangScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
