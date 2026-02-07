import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function SearchRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/search" />
    </Suspense>
  );
}
