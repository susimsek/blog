import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';

export default function AdminSettingsCommentsRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={ADMIN_ROUTES.settings.comments} />
    </Suspense>
  );
}
