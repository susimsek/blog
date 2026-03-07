import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminChangePasswordRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/settings/security" />
    </Suspense>
  );
}
