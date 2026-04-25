"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

const authRoutes = new Set([
  "/admin/login",
  "/admin/sign-in",
  "/admin/sign-out",
  "/admin/forgot-password",
  "/admin/otp-verification",
  "/admin/reset-password",
]);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.has(pathname);

  if (isAuthRoute) {
    return <div className="admin-bg min-h-screen text-zinc-100">{children}</div>;
  }

  return (
    <div className="admin-bg min-h-screen text-zinc-100 md:flex">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
        <AdminTopbar />
        {children}
      </main>
    </div>
  );
}
