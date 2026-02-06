import React, { useEffect, ReactElement } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import languageDetector from './languageDetector';
import Loading from '@/components/common/Loading';

type RouterLike = {
  replace: (href: string) => void;
};

const detectAndRedirect = (router: RouterLike, pathname: string, targetPath: string) => {
  const detectedLng = languageDetector.detect() as string;

  if (targetPath.startsWith('/' + detectedLng) && pathname === '/404') {
    router.replace('/' + detectedLng + pathname);
    return;
  }

  if (languageDetector.cache) {
    languageDetector.cache(detectedLng);
  }

  router.replace('/' + detectedLng + targetPath);
};

// Custom hook for language-based redirection with spinner display
export const useRedirect = (to?: string): ReactElement => {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const asPath = (() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();
  const targetPath = to ?? asPath;

  useEffect(() => {
    detectAndRedirect(router, pathname, targetPath);
  }, [router, pathname, targetPath]);

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
