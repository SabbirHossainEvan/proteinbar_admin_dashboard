"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { getAdminAuth } from "@/lib/adminAuth";
import { canAccessAdminPage } from "@/lib/adminPermissions";

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
  const router = useRouter();
  const isAuthRoute = authRoutes.has(pathname);
  const auth = useMemo(() => (isAuthRoute ? null : getAdminAuth()), [isAuthRoute]);
  const hasAccess = isAuthRoute ? true : canAccessAdminPage(pathname, auth?.user);

  useEffect(() => {
    if (!isAuthRoute && !auth?.user) {
      router.replace("/admin/sign-in");
      return;
    }

    if (!isAuthRoute && auth?.user && !hasAccess) {
      router.replace("/admin");
    }
  }, [auth, hasAccess, isAuthRoute, router]);

  if (isAuthRoute) {
    return <div className="admin-bg min-h-screen text-zinc-100">{children}</div>;
  }

  if (!hasAccess) {
    return <div className="admin-bg min-h-screen text-zinc-100" />;
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
