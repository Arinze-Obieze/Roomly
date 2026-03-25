import { createClient } from '@/core/utils/supabase/server';
import { ensureUserProfile } from '@/core/utils/auth/ensureUserProfile';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth check error:', error);
        return NextResponse.redirect(
          new URL(`/auth/auth-code-error?message=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      await ensureUserProfile(user);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(
        new URL('/auth/auth-code-error?message=Authentication failed', request.url)
      );
    }

    // URL to redirect to after code exchange completes
    return NextResponse.redirect(new URL(next, request.url));
  }

  // No auth code in query usually means a hash-token flow (#access_token=...).
  // Redirect to a client page that can read the hash and establish a session.
  return NextResponse.redirect(new URL(`/auth/confirm?next=${encodeURIComponent(next)}`, request.url));
}
