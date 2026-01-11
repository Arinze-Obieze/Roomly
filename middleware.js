import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get user session and refresh tokens
  const { supabaseResponse, user } = await updateSession(request);

  // Define route types
  const isAuthPage = pathname === '/login' || pathname === '/signup' || 
                     pathname === '/forgot-password' || pathname === '/reset-password';
  const isAuthApiRoute = pathname.startsWith('/api/auth') || pathname === '/api/signup';
  const isProtectedRoute = pathname.startsWith('/profile') || 
                          pathname.startsWith('/listings') ||
                          (pathname.startsWith('/api') && !isAuthApiRoute);
  const isPublicRoute = pathname === '/' || pathname.startsWith('/dashboard');

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protect routes that require authentication
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Allow access to public routes and auth pages
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images, svg
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
