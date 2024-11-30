import React, { useEffect } from 'react';
import { NextRouter, useRouter } from 'next/router';
import languageDetector from './languageDetector';
import Loading from '@/components/Loading';

// Helper function for language-based redirection
const detectAndRedirect = (router: NextRouter, targetPath: string) => {
  const detectedLng = languageDetector.detect() as string;

  if (targetPath.startsWith('/' + detectedLng) && router.route === '/404') {
    router.replace('/' + detectedLng + router.route);
    return;
  }

  if (languageDetector.cache) {
    languageDetector.cache(detectedLng);
  }

  router.replace('/' + detectedLng + targetPath);
};

// Custom hook for language-based redirection with spinner display
export const useRedirect = (to?: string): JSX.Element => {
  const router = useRouter();
  const targetPath = to || router.asPath;

  useEffect(() => {
    detectAndRedirect(router, targetPath);
  }, [router, targetPath]);

  return <Loading />;
};

// Functional component for direct usage with spinner display
export const Redirect: React.FC = () => {
  return useRedirect();
};

// Higher-order function for specific path redirection with spinner display
export const getRedirect =
  (to: string): React.FC =>
  () => {
    return useRedirect(to);
  };
