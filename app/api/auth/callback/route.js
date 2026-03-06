import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`
    );
  }

  // No auth code in query usually means a hash-token flow (#access_token=...).
  // Redirect to a client page that can read the hash and establish a session.
  return NextResponse.redirect(
    `${origin}/auth/confirm${next ? `?next=${encodeURIComponent(next)}` : ''}`
  );
}
