'use client';

import { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { publishAppError, reportAppError, unknownAppError } from '@/lib/errors/appError';

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Readonly<GlobalErrorPageProps>) {
  useEffect(() => {
    const appError = unknownAppError(error, 'Unexpected global error');
    const context = {
      source: 'next-global-error-boundary',
    };
    publishAppError(appError, context);
    reportAppError(appError, context);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="container py-5">
          <h1 className="h3 fw-bold mb-3">Application error</h1>
          <p className="text-muted mb-4">A global error occurred. Please retry the operation.</p>
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
