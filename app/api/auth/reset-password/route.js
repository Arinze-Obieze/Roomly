import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCSRFRequest } from '@/core/utils/csrf';

// Rate limit tracking for password reset (in-memory for dev; use Redis for prod)
const resetAttempts = new Map();

const checkResetRateLimit = (email) => {
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX_ATTEMPTS = 3; // Max 3 attempts per email per hour

  if (!resetAttempts.has(email)) {
    resetAttempts.set(email, []);
  }

  const attempts = resetAttempts.get(email);
  const recentAttempts = attempts.filter(time => now - time < WINDOW);
  resetAttempts.set(email, recentAttempts);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }

  recentAttempts.push(now);
  return true;
};

export async function POST(req) {
  try {
    // Validate CSRF token
    const csrfValidation = await validateCSRFRequest(req);
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { password, email } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Rate limiting per email
    if (email && !checkResetRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again in 1 hour.' },
        { status: 429 }
      );
    }

    // Get session from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No active session found. Please request a new password reset link.' },
        { status: 401 }
      );
    }

    // Create Supabase client with the session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Set the session
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Invalid or expired session. Please request a new password reset link.' },
        { status: 401 }
      );
    }

    // Update the password
    const { data: updateData, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 400 }
      );
    }

    // Clear old session cookies - user must re-authenticate with new password
    const newCookieStore = await cookies();
    newCookieStore.delete('sb-access-token');
    newCookieStore.delete('sb-refresh-token');

    return NextResponse.json({
      message: 'Password updated successfully. Please log in with your new password.',
      requiresReauth: true
    });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
