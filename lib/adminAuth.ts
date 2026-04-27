"use client";

import type { AdminAuthRecord } from "@/redux/backoffice/types";

const STORAGE_KEY = "proteinbar_admin_auth";

export function getAdminAuth(): AdminAuthRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminAuthRecord;
  } catch {
    return null;
  }
}

export function setAdminAuth(auth: AdminAuthRecord) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAdminAuth() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

