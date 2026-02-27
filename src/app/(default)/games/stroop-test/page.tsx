import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function StroopTestRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/games/stroop-test" />
    </Suspense>
  );
}
