// pages/_document.tsx
import Document, { Head, Html, Main, NextScript } from 'next/document';
import i18nextConfig from '@root/next-i18next.config';
import { assetPrefix } from '@/config/constants';

class MyDocument extends Document {
  render() {
    const currentLocale = this.props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;
    const themeInitScript = `
(function () {
  try {
    var STORAGE_KEY = 'theme';
    var root = document.documentElement;
    var classes = ['dark-theme', 'oceanic-theme', 'forest-theme'];
    for (var i = 0; i < classes.length; i++) root.classList.remove(classes[i]);

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { stored = null; }

    var classMap = { light: '', dark: 'dark-theme', oceanic: 'oceanic-theme', forest: 'forest-theme' };
    var themeClass = '';
    if (stored && Object.prototype.hasOwnProperty.call(classMap, stored)) {
      themeClass = classMap[stored] || '';
    } else {
      var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
      if (mq && mq.matches) themeClass = classMap.dark;
    }

    if (themeClass) root.classList.add(themeClass);
  } catch (e) {}
})();
`.trim();

    return (
      <Html lang={currentLocale}>
        <Head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <link rel="apple-touch-icon" sizes="180x180" href={`${assetPrefix}/apple-touch-icon.png`} />
          <link rel="icon" type="image/png" sizes="16x16" href={`${assetPrefix}/favicon-16x16.png`} />
          <link rel="icon" type="image/png" sizes="32x32" href={`${assetPrefix}/favicon-32x32.png`} />
          <link rel="icon" type="image/png" sizes="192x192" href={`${assetPrefix}/favicon-192x192.png`} />
          <link rel="shortcut icon" href={`${assetPrefix}/favicon.ico`} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
