"use client";

import type { AdminAuthRecord } from "@/redux/backoffice/types";

const STORAGE_KEY = "proteinbar_admin_auth";
const AUTH_CHANGE_EVENT = "proteinbar_admin_auth_changed";

let cachedAuthRaw: string | null = null;
let cachedAuthValue: AdminAuthRecord | null = null;

function safeGetBrowserStorage(key: "localStorage" | "sessionStorage") {
  try {
    return window[key];
  } catch {
    return null;
  }
}

function safeGetStoredAuth(storage: Storage | null) {
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSetStoredAuth(storage: Storage | null, raw: string) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    // Storage can be unavailable in strict browser privacy modes.
    return false;
  }
}

function safeRemoveStoredAuth(storage: Storage | null, expectedRaw?: string) {
  if (!storage) return false;
  try {
    if (expectedRaw !== undefined && storage.getItem(STORAGE_KEY) !== expectedRaw) {
      return false;
    }
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    // Storage can be unavailable in strict browser privacy modes.
    return false;
  }
}

function withoutTokens(auth: AdminAuthRecord): AdminAuthRecord {
  const safeAuth = { ...auth };
  delete safeAuth.token;
  delete safeAuth.accessToken;
  delete safeAuth.refreshToken;

  if (safeAuth.session) {
    safeAuth.session = { ...safeAuth.session };
    delete safeAuth.session.token;
    delete safeAuth.session.accessToken;
    delete safeAuth.session.refreshToken;
  }

  return safeAuth;
}

function parseStoredAuth(
  raw: string,
  sourceStorage: Storage | null,
  sessionStorage: Storage | null
) {
  if (raw === cachedAuthRaw && cachedAuthValue) {
    return {
      auth: cachedAuthValue,
      persistedToSession: safeSetStoredAuth(sessionStorage, raw)
    };
  }

  try {
    const parsed = JSON.parse(raw) as AdminAuthRecord;
    if (!parsed || typeof parsed !== "object" || !parsed.user) {
      throw new Error("Invalid stored admin auth");
    }
    const safeAuth = withoutTokens(parsed);
    const safeRaw = JSON.stringify(safeAuth);
    cachedAuthRaw = safeRaw;
    cachedAuthValue = safeAuth;
    return {
      auth: safeAuth,
      persistedToSession: safeSetStoredAuth(sessionStorage, safeRaw)
    };
  } catch {
    safeRemoveStoredAuth(sourceStorage, raw);
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

  const localStorage = safeGetBrowserStorage("localStorage");
  const sessionStorage = safeGetBrowserStorage("sessionStorage");
  const localRaw = safeGetStoredAuth(localStorage);
  if (localRaw) {
    const parsedLocalAuth = parseStoredAuth(localRaw, localStorage, sessionStorage);
    if (parsedLocalAuth) {
      if (parsedLocalAuth.persistedToSession) {
        safeRemoveStoredAuth(localStorage, localRaw);
      }
      return parsedLocalAuth.auth;
    }
  }

  const sessionRaw = safeGetStoredAuth(sessionStorage);
  if (sessionRaw) {
    return parseStoredAuth(sessionRaw, sessionStorage, sessionStorage)?.auth ?? null;
  }

  if (cachedAuthRaw !== null) {
    cachedAuthRaw = null;
    cachedAuthValue = null;
  }

  return null;
}

export function setAdminAuth(auth: AdminAuthRecord) {
  if (typeof window === "undefined") return;
  const safeAuth = withoutTokens(auth);
  const raw = JSON.stringify(safeAuth);
  cachedAuthRaw = raw;
  cachedAuthValue = safeAuth;
  safeRemoveStoredAuth(safeGetBrowserStorage("localStorage"));
  safeSetStoredAuth(safeGetBrowserStorage("sessionStorage"), raw);
  emitAuthChange();
}

export function clearAdminAuth() {
  if (typeof window === "undefined") return;
  cachedAuthRaw = null;
  cachedAuthValue = null;
  safeRemoveStoredAuth(safeGetBrowserStorage("localStorage"));
  safeRemoveStoredAuth(safeGetBrowserStorage("sessionStorage"));
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

