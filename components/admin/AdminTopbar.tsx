"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitleMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/menu": "Menu",
  "/admin/products": "Products",
  "/admin/orders": "Orders",
  "/admin/customers": "Locations",
  "/admin/monthly-plans": "Monthly Plans",
  "/admin/subscriptions": "Subscriptions",
  "/admin/orders-of-day": "Orders of the Day",
  "/admin/printing": "Printing",
  "/admin/notifications": "Notifications",
  "/admin/profile": "Profile",
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
      <path d="M10 20a2 2 0 004 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0114 0" />
    </svg>
  );
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const title = pageTitleMap[pathname] ?? "Admin";

  return (
    <header className="admin-panel relative z-40 mb-6 flex items-center justify-between overflow-visible rounded-2xl px-4 py-3.5 md:px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Admin Panel</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="relative z-50 flex items-center gap-2">
        <Link
          href="/admin/notifications"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/70 text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          <BellIcon />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-300" />
        </Link>

        <Link
          href="/admin/profile"
          aria-label="Profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/70 text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          <ProfileIcon />
        </Link>

        <Link
          href="/admin/sign-out"
          className="ml-1 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:border-zinc-500"
        >
          Sign out
        </Link>
      </div>
    </header>
  );
}
