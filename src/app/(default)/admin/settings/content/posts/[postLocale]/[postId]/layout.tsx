import type { ReactNode } from 'react';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { loadLocaleResources } from '@/i18n/server';
import AdminAccountPage from '@/views/AdminAccountPage';
import { defaultLocale } from '@/i18n/settings';

type AdminSettingsContentPostLayoutProps = {
  children: ReactNode;
};

export default async function AdminSettingsContentPostLayout({
  children,
}: Readonly<AdminSettingsContentPostLayoutProps>) {
  const resources = await loadLocaleResources(defaultLocale, ['admin-account', 'admin-common']);

  return (
    <RouteI18nProvider locale={defaultLocale} resources={resources}>
      <AdminAccountPage section="content" />
      {children}
    </RouteI18nProvider>
  );
}
