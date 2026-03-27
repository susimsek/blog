import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function AdminEmailChangeRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/admin/email-change" />
    </Suspense>
  );
}
