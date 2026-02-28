import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function VisualMemoryRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/games/visual-memory" />
    </Suspense>
  );
}
