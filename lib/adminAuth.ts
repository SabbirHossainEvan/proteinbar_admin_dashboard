"use client";

import type { AdminAuthRecord } from "@/redux/backoffice/types";

const STORAGE_KEY = "proteinbar_admin_auth";
const AUTH_CHANGE_EVENT = "proteinbar_admin_auth_changed";

let cachedAuthRaw: string | null = null;
let cachedAuthValue: AdminAuthRecord | null = null;

function safeGetStoredAuth(storage: Storage | null) {
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseStoredAuth(raw: string, storage: Storage | null) {
  if (raw === cachedAuthRaw) {
    return cachedAuthValue;
  }

  try {
    const parsed = JSON.parse(raw) as AdminAuthRecord;
    cachedAuthRaw = raw;
    cachedAuthValue = parsed;
    return parsed;
  } catch {
    storage?.removeItem(STORAGE_KEY);
    if (raw === cachedAuthRaw) {
      cachedAuthRaw = null;
      cachedAuthValue = null;
    }
    return null;
  }
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAdminAuth(): AdminAuthRecord | null {
  if (typeof window === "undefined") return null;

  const localRaw = safeGetStoredAuth(window.localStorage);
  if (localRaw) {
    return parseStoredAuth(localRaw, window.localStorage);
  }

  const sessionRaw = safeGetStoredAuth(window.sessionStorage);
  if (sessionRaw) {
    try {
      window.localStorage.setItem(STORAGE_KEY, sessionRaw);
    } catch {
      // localStorage can be unavailable in strict browser privacy modes.
    }
    return parseStoredAuth(sessionRaw, window.sessionStorage);
  }

  if (cachedAuthRaw !== null) {
    cachedAuthRaw = null;
    cachedAuthValue = null;
  }

  return null;
}

export function setAdminAuth(auth: AdminAuthRecord) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(auth);
  cachedAuthRaw = raw;
  cachedAuthValue = auth;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.sessionStorage.setItem(STORAGE_KEY, raw);
  emitAuthChange();
}

export function clearAdminAuth() {
  if (typeof window === "undefined") return;
  cachedAuthRaw = null;
  cachedAuthValue = null;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  emitAuthChange();
}

export function subscribeToAdminAuthChanges(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

