// pages/404.tsx
import { Container } from 'react-bootstrap';
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
        <meta
          name="description"
          content="The page you are looking for does not exist or has been moved. Return to the homepage or check the URL."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Container className="text-center py-5" style={{ maxWidth: '600px' }}>
        <h1 className="display-1 fw-bold text-danger">
          <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
          404
        </h1>
        <h2 className="mb-4">Oops! Page Not Found</h2>
        <p className="fs-5 text-muted mb-4">
          The page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.
        </p>
        <Link href="/" className="btn btn-primary px-4">
          <FontAwesomeIcon icon="home" className="me-2" />
          Back to Home
        </Link>
      </Container>
    </>
  );
}
