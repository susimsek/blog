import type { ReactNode } from 'react';
import RouteI18nProvider from '@/i18n/RouteI18nProvider';
import { loadLocaleResources } from '@/i18n/server';
import AdminAccountPage from '@/views/AdminAccountPage';

type AdminSettingsContentPostLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminSettingsContentPostLayout({
  children,
  params,
}: Readonly<AdminSettingsContentPostLayoutProps>) {
  const { locale } = await params;
  const resources = await loadLocaleResources(locale, ['admin-account', 'admin-common']);

  return (
    <RouteI18nProvider locale={locale} resources={resources}>
      <AdminAccountPage section="content" />
      {children}
    </RouteI18nProvider>
  );
}
