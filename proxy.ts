import { NextRequest, NextResponse } from "next/server";

const publicAdminRoutes = new Set([
  "/admin/login",
  "/admin/sign-in",
  "/admin/sign-out",
  "/admin/forgot-password",
  "/admin/otp-verification",
  "/admin/reset-password"
]);
const ADMIN_ACCESS_COOKIE_NAME = "accessToken";
const ADMIN_REFRESH_COOKIE_NAME = "refreshToken";

export function proxy(request: NextRequest) {
  if (publicAdminRoutes.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie =
    Boolean(request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value) ||
    Boolean(request.cookies.get(ADMIN_REFRESH_COOKIE_NAME)?.value);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
