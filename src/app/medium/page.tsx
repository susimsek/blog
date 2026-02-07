import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function MediumRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/medium" />
    </Suspense>
  );
}
