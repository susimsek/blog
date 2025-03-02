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
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self'; style-src 'unsafe-inline' static.licdn.com static-exp1.licdn.com static-exp2.licdn.com static-exp3.licdn.com www.linkedin.com;"
          />
          <link rel="apple-touch-icon" sizes="180x180" href={`${assetPrefix}/favicons/apple-touch-icon.png`} />
          <link rel="icon" type="image/png" sizes="32x32" href={`${assetPrefix}/favicons/favicon-32x32.png`} />
          <link rel="icon" type="image/png" sizes="16x16" href={`${assetPrefix}/favicons/favicon-16x16.png`} />
          <link rel="shortcut icon" href={`${assetPrefix}/favicons/favicon.ico`} />
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
