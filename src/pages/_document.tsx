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
          <link rel="icon" href={`${assetPrefix}/favicon.ico`} />
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
