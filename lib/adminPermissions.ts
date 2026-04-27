"use client";

import type { AdminNavSection } from "@/data/admin/navigation";
import { adminNavSections } from "@/data/admin/navigation";
import type { AdminAuthUser } from "@/redux/backoffice/types";

const ALWAYS_ALLOWED = new Set(["/admin", "/admin/profile"]);

export function getAllowedPages(user?: Pick<AdminAuthUser, "role" | "allowedPages" | "canManageUsers"> | null) {
  if (!user) return new Set<string>();
  if (user.role === "super_admin") {
    return new Set(adminNavSections.flatMap((section) => section.items.map((item) => item.href)));
  }

  return new Set([...ALWAYS_ALLOWED, ...(user.allowedPages ?? []), ...(user.canManageUsers ? ["/admin/users-permissions"] : [])]);
}

export function canAccessAdminPage(pathname: string, user?: Pick<AdminAuthUser, "role" | "allowedPages" | "canManageUsers"> | null) {
  const allowedPages = getAllowedPages(user);
  if (!allowedPages.size) return false;
  if (allowedPages.has(pathname)) return true;

  for (const page of allowedPages) {
    if (page !== "/admin" && pathname.startsWith(`${page}/`)) {
      return true;
    }
  }

  return false;
}

export function getVisibleAdminNavSections(user?: Pick<AdminAuthUser, "role" | "allowedPages" | "canManageUsers"> | null): AdminNavSection[] {
  const allowedPages = getAllowedPages(user);

  return adminNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (allowedPages.has(item.href)) return true;
        for (const page of allowedPages) {
          if (page !== "/admin" && item.href.startsWith(`${page}/`)) {
            return true;
          }
        }
        return false;
      })
    }))
    .filter((section) => section.items.length > 0);
}

