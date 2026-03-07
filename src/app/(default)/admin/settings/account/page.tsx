import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminSettingsAccountRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/settings/account" />
    </Suspense>
  );
}
