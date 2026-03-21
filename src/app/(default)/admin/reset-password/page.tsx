import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminResetPasswordRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/reset-password" />
    </Suspense>
  );
}
