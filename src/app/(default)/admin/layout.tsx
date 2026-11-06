import AdminChrome from '@/components/admin/AdminChrome';

export default function AdminLayout({ children }: Readonly<LayoutProps<'/admin'>>) {
  return <AdminChrome>{children}</AdminChrome>;
}
