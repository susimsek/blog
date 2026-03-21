import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminForgotPasswordRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/forgot-password" />
    </Suspense>
  );
}
