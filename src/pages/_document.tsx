// pages/_document.tsx
import Document, { Head, Html, Main, NextScript } from 'next/document';
import i18nextConfig from '../../next-i18next.config';
import { assetPrefix } from '@/config/constants';

class MyDocument extends Document {
  render() {
    const currentLocale = this.props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;

    return (
      <Html lang={currentLocale}>
        <Head>
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
