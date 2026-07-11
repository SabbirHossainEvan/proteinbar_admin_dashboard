"use client";

import type { AdminNavSection } from "@/data/admin/navigation";
import { adminNavSections } from "@/data/admin/navigation";
import type { AdminAuthUser } from "@/redux/backoffice/types";

const ALWAYS_ALLOWED = new Set(["/admin", "/admin/profile"]);
const IMPLIED_PAGE_ACCESS: Record<string, string[]> = {
  "/admin/orders-day-printing": ["/admin/orders-of-day", "/admin/printing"],
  "/admin/orders-of-day": ["/admin/orders-day-printing"],
  "/admin/printing": ["/admin/orders-day-printing"]
};

export function getAllowedPages(user?: Pick<AdminAuthUser, "role" | "allowedPages" | "canManageUsers"> | null) {
  if (!user) return new Set<string>();
  const allowed =
    user.role === "super_admin"
      ? new Set(adminNavSections.flatMap((section) => section.items.map((item) => item.href)))
      : new Set([...ALWAYS_ALLOWED, ...(user.allowedPages ?? []), ...(user.canManageUsers ? ["/admin/users-permissions"] : [])]);

  for (const [page, relatedPages] of Object.entries(IMPLIED_PAGE_ACCESS)) {
    if (allowed.has(page) || relatedPages.some((relatedPage) => allowed.has(relatedPage))) {
      allowed.add(page);
      relatedPages.forEach((relatedPage) => allowed.add(relatedPage));
    }
  }

  return allowed;
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

