import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminAccountRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/change-password" />
    </Suspense>
  );
}
