import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client with SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear Supabase SSR cookies
    const projectRef = 'aiovmhiokeisdizhcxvm'; // <-- Replace with your actual Supabase project ref if different
    cookieStore.set(`sb-${projectRef}-auth-token`, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    cookieStore.set(`sb-${projectRef}-refresh-token`, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
