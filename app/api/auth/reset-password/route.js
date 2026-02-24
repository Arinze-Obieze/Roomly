import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
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

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'No active session found. Please request a new password reset link.' },
        { status: 401 }
      );
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 400 }
      );
    }

    await supabase.auth.signOut();

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
