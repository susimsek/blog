import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin" />
    </Suspense>
  );
}
