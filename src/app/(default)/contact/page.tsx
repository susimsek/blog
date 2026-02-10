import { Suspense } from 'react';
import LocaleRedirect from '@/components/LocaleRedirect';

export default function ContactRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LocaleRedirect path="/contact" />
    </Suspense>
  );
}
