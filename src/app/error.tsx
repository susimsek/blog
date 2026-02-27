'use client';

import { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import { publishAppError, reportAppError, unknownAppError } from '@/lib/errors/appError';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SegmentErrorPage({ error, reset }: Readonly<ErrorPageProps>) {
  useEffect(() => {
    const appError = unknownAppError(error, 'Unexpected render error');
    const context = {
      source: 'next-segment-error-boundary',
    };
    publishAppError(appError, context);
    reportAppError(appError, context);
  }, [error]);

  return (
    <div className="container py-5">
      <h1 className="h3 fw-bold mb-3">Something went wrong</h1>
      <p className="text-muted mb-4">An unexpected error occurred while rendering this page segment.</p>
      <Button variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
