import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';

export default function AdminSettingsNewsletterRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={ADMIN_ROUTES.settings.newsletter} />
    </Suspense>
  );
}
