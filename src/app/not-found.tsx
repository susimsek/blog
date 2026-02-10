import Link from 'next/link';
import { defaultLocale } from '@/i18n/settings';
import { buildLocalizedPath } from '@/lib/metadata';

export default function GlobalNotFound() {
  const homePath = buildLocalizedPath(defaultLocale);

  return (
    <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <p>
        <Link href={homePath}>Go to home</Link>
      </p>
    </main>
  );
}
