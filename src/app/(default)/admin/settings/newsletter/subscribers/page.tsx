import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';

export default function AdminSettingsNewsletterSubscribersRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path={ADMIN_ROUTES.settings.newsletterSubscribers} />
    </Suspense>
  );
}
