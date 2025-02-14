import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function fetchUserDetails(sessionToken: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/details`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }

  return response.json();
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token') || request.headers.get('Authorization');

  // Protect all routes that start with /api or /dashboard
  if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = request.cookies.get('next-auth.session-token');
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Fetch user details to check if the user is a superuser
    const user = await fetchUserDetails(session.value);
    if (!user || !user.issuperuser) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/admin/:path*'],
};