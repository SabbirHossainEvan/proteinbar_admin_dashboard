import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const localAdminSessionCookieSecret = "proteinbar-local-admin-session-cookie-secret";

const publicAdminRoutes = new Set([
  "/admin/login",
  "/admin/sign-in",
  "/admin/sign-out",
  "/admin/forgot-password",
  "/admin/otp-verification",
  "/admin/reset-password"
]);

export function proxy(request: NextRequest) {
  if (publicAdminRoutes.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const sessionCookieName =
    process.env.ADMIN_SESSION_COOKIE_NAME?.trim() || "proteinbar_admin_session";
  const configuredSecret = process.env.ADMIN_SESSION_COOKIE_SECRET?.trim();
  const sessionCookieSecret =
    configuredSecret ||
    (process.env.NODE_ENV === "development" ? localAdminSessionCookieSecret : "");
  const [expiresAt = "", signature = "", extra = ""] =
    request.cookies.get(sessionCookieName)?.value.split(".") ?? [];
  const expectedSignature = sessionCookieSecret
    ? crypto.createHmac("sha256", sessionCookieSecret).update(expiresAt).digest("base64url")
    : "";
  const isValidSignature =
    Boolean(signature) &&
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  const isValidSessionMarker =
    !extra &&
    /^\d+$/.test(expiresAt) &&
    Number(expiresAt) * 1000 > Date.now() &&
    isValidSignature;

  if (!isValidSessionMarker) {
    return NextResponse.redirect(new URL("/admin/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
