import AdminChrome from '@/components/admin/AdminChrome';

export default function AdminLayout({ children }: Readonly<LayoutProps<'/[locale]/admin'>>) {
  return <AdminChrome>{children}</AdminChrome>;
}
