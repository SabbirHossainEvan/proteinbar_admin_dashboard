"use client";

import type { ReactNode } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { getAdminAuth, subscribeToAdminAuthChanges } from "@/lib/adminAuth";
import { canAccessAdminPage } from "@/lib/adminPermissions";
import { useGetAdminMeQuery } from "@/redux/api/adminApi";
import type { AdminAuthRecord } from "@/redux/backoffice/types";

const authRoutes = new Set([
  "/admin/login",
  "/admin/sign-in",
  "/admin/sign-out",
  "/admin/forgot-password",
  "/admin/otp-verification",
  "/admin/reset-password",
]);

const subscribeToHydration = () => () => undefined;
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = authRoutes.has(pathname);
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot
  );
  const storedAuth = useSyncExternalStore(subscribeToAdminAuthChanges, getAdminAuth, () => null);
  const auth: AdminAuthRecord | null = isAuthRoute ? null : storedAuth;
  const {
    data: adminMeData,
    isLoading: isCheckingSession,
    isFetching: isFetchingSession
  } = useGetAdminMeQuery(undefined, {
    skip: !hasHydrated || isAuthRoute || !auth?.user,
    refetchOnMountOrArgChange: true
  });
  const verifiedUser = adminMeData?.data?.user ?? auth?.user;
  const hasAccess = isAuthRoute ? true : canAccessAdminPage(pathname, verifiedUser);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthRoute && !auth?.user) {
      router.replace("/admin/sign-in");
      return;
    }

    if (!isAuthRoute && auth?.user && !isCheckingSession && !isFetchingSession && !hasAccess) {
      router.replace("/admin");
    }
  }, [auth, hasAccess, hasHydrated, isAuthRoute, isCheckingSession, isFetchingSession, router]);

  if (isAuthRoute) {
    return <div className="admin-bg admin-light min-h-screen text-zinc-900">{children}</div>;
  }

  if (!hasHydrated || isCheckingSession || isFetchingSession || !hasAccess) {
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
