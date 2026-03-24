import { updateSession } from '@/core/utils/supabase/middleware';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');
  const isSuperadminPath = pathname.startsWith('/superadmin') || pathname.startsWith('/api/superadmin');

  // Get user session and refresh tokens
  const { supabaseResponse, user, networkError, supabase } = await updateSession(request);

  // Define route types
  const isAuthPage = pathname === '/login' || pathname === '/signup' || 
                     pathname === '/forgot-password';
  const isAuthApiRoute = pathname.startsWith('/api/auth') || pathname === '/api/signup';
  const isProtectedRoute = pathname.startsWith('/profile') || 
                          pathname.startsWith('/listings') ||
                          pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/superadmin') || // Add superadmin as protected
                          (pathname.startsWith('/api') && !isAuthApiRoute && !pathname.startsWith('/api/properties'));

  // Fail closed for protected API routes when auth resolution is unavailable.
  // This preserves page UX during transient Supabase issues without letting
  // write-capable API routes fall through unauthenticated.
  if (isApiRoute && isProtectedRoute && networkError) {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Protect routes that require authentication
  if (isProtectedRoute && !user && !networkError) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized', redirectTo: '/login' },
        { status: 401 }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Superadmin authorization check
  if (isSuperadminPath) {
    // For privileged routes, fail closed: if we can't resolve an authenticated user, redirect.
    if (!user) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized', redirectTo: '/login' },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    const metadataRole = user?.user_metadata?.is_superadmin || user?.app_metadata?.is_superadmin;
    if (!metadataRole) {
      const { data: roleRow, error: roleError } = await supabase
        .from('users')
        .select('is_superadmin')
        .eq('id', user.id)
        .maybeSingle();

      if (roleError || !roleRow?.is_superadmin) {
        if (isApiRoute) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
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
