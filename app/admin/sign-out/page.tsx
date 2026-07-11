"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearAdminAuth } from "@/lib/adminAuth";
import { useAdminLogoutMutation } from "@/redux/api/adminApi";

export default function AdminSignOutPage() {
  const [adminLogout] = useAdminLogoutMutation();

  useEffect(() => {
    void adminLogout()
      .unwrap()
      .catch(() => undefined)
      .finally(() => {
        clearAdminAuth();
        window.sessionStorage.removeItem("proteinbar_admin_reset_email");
      });
  }, [adminLogout]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="admin-panel w-full max-w-md rounded-2xl p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Signed Out</h1>
        <p className="mt-2 text-sm text-zinc-300">You are signed out from the admin panel.</p>
        <Link
          href="/admin/sign-in"
          className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
        >
          Sign In Again
        </Link>
      </div>
    </div>
  );
}
