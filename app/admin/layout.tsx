import AdminSidebarLayout from "@/shared/components/layouts/AdminSidebarLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}
