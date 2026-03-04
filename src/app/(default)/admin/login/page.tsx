import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminLoginRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/login" />
    </Suspense>
  );
}
