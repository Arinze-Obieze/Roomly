import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set Supabase SSR standard cookies for session
    const projectRef = 'aiovmhiokeisdizhcxvm'; // <-- Replace with your actual Supabase project ref if different
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    cookieStore.set(`sb-${projectRef}-auth-token`, data.session.access_token, {
      httpOnly: false, // Temporarily false to check in browser
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
    cookieStore.set(`sb-${projectRef}-refresh-token`, data.session.refresh_token, {
      httpOnly: false, // Temporarily false to check in browser
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
