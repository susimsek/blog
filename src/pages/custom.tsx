import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Sayfa Başlığı',
  description: 'Custom sayfanın açıklaması.',
  openGraph: {
    title: 'Custom Sayfa Başlığı',
    description: 'Custom sayfanın açıklaması.',
    url: 'https://kullaniciadi.github.io/repo-adi/custom',
    images: [
      {
        url: 'https://ornek.com/custom-og-image.jpg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const Custom = () => {
  return (
    <main>
      <h1>Custom Sayfaya Hoşgeldiniz</h1>
      <p>Bu, custom.tsx dosyasındaki sayfa örneğidir.</p>
    </main>
  );
};

export default Custom;
