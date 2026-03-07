import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminSettingsAppearanceRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/settings/appearance" />
    </Suspense>
  );
}
