import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AboutRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/about" />
    </Suspense>
  );
}
