import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get auth cookie/token
  const token = request.cookies.get('auth0.is.authenticated');
  
  // Check if the request is for an auth page
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/');
  
  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/callback'];
  
  if (!token && !publicPaths.includes(request.nextUrl.pathname)) {
    // Redirect to login if not authenticated and not on a public path
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  if (token && isAuthPage && !request.nextUrl.pathname.includes('logout')) {
    // Redirect to dashboard if authenticated and trying to access auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}