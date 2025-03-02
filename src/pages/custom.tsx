import Head from 'next/head';
import { NextPage } from 'next';

const Custom: NextPage = () => {
  return (
    <>
      <Head>
        <title>Custom Sayfa Başlığı</title>
        <meta name="description" content="Custom sayfanın açıklaması." />
        {/* Open Graph meta etiketleri */}
        <meta property="og:title" content="Custom Sayfa Başlığı" />
        <meta property="og:description" content="Custom sayfanın açıklaması." />
        <meta property="og:image" content="https://ornek.com/custom-og-image.jpg" />
        <meta property="og:url" content="https://kullaniciadi.github.io/repo-adi/custom" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <main>
        <h1>Custom Sayfaya Hoşgeldiniz</h1>
        <p>Bu, custom.tsx dosyasındaki sayfa örneğidir.</p>
      </main>
    </>
  );
};

export default Custom;
