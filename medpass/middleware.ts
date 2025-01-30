import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get auth token from cookie
  const isAuthenticated = request.cookies.get("auth0.is.authenticated")?.value;
  const netIdVerified = request.cookies.get("netid.verified")?.value;
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/auth/login", "/auth/callback", "/dev"];
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated but no NetID -> redirect to NetID verification
  // Unless they're already on the verify-netid page
  if (!netIdVerified && !path.includes("/auth/verify-netid")) {
    return NextResponse.redirect(new URL("/auth/verify-netid", request.url));
  }

  // If they have both auth and NetID but try to access auth pages -> redirect to dashboard
  if (isAuthenticated && netIdVerified && path.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};