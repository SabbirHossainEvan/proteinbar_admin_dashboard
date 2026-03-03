import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-bg min-h-screen text-zinc-100 md:flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
