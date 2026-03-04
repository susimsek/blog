import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminDashboardRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/dashboard" />
    </Suspense>
  );
}
