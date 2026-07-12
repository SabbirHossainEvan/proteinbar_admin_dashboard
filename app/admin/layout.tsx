"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { getAdminAuth, setAdminAuth } from "@/lib/adminAuth";
import { canAccessAdminPage } from "@/lib/adminPermissions";
import { useGetAdminMeQuery } from "@/redux/api/adminApi";

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
  const {
    data: adminMeData,
    isLoading: isCheckingSession,
    isFetching: isFetchingSession
  } = useGetAdminMeQuery(undefined, {
    skip: isAuthRoute || !auth?.user,
    refetchOnMountOrArgChange: true
  });
  const verifiedUser = adminMeData?.data?.user ?? auth?.user;
  const hasAccess = isAuthRoute ? true : canAccessAdminPage(pathname, verifiedUser);

  useEffect(() => {
    if (!isAuthRoute && adminMeData?.data?.refreshToken) {
      setAdminAuth(adminMeData.data);
    }

    if (!isAuthRoute && !auth?.user) {
      router.replace("/admin/sign-in");
      return;
    }

    if (!isAuthRoute && auth?.user && !isCheckingSession && !isFetchingSession && !hasAccess) {
      router.replace("/admin");
    }
  }, [adminMeData, auth, hasAccess, isAuthRoute, isCheckingSession, isFetchingSession, router]);

  if (isAuthRoute) {
    return <div className="admin-bg admin-light min-h-screen text-zinc-900">{children}</div>;
  }

  if (isCheckingSession || isFetchingSession || !hasAccess) {
    return <div className="admin-bg min-h-screen text-zinc-900" />;
  }

  return (
    <div className="admin-bg min-h-screen text-zinc-900 md:flex">
      <AdminSidebar />
      <main className="admin-light min-w-0 flex-1 p-4 md:p-6 lg:p-8">
        <AdminTopbar />
        {children}
      </main>
    </div>
  );
}
