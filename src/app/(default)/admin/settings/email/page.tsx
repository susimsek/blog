import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminSettingsEmailRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/settings/email" />
    </Suspense>
  );
}
