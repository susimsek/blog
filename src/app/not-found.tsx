import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <main style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <p>
        <Link href="/en">Go to home</Link>
      </p>
    </main>
  );
}
