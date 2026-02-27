import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function SchulteTableRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/games/schulte-table" />
    </Suspense>
  );
}
