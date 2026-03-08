import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';

export default function AdminSettingsRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={ADMIN_ROUTES.settings.profile} />
    </Suspense>
  );
}
