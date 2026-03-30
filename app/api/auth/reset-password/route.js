import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { assertRateLimit, buildRateLimitHeaders } from '@/core/utils/rate-limit';

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

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : 'session-reset';
    const rateLimit = await assertRateLimit({
      request: req,
      key: 'auth-reset-password',
      limit: 3,
      windowSeconds: 60 * 60,
      scope: [normalizedEmail, 'ip'],
      fallbackMode: 'deny',
    });

    if (!rateLimit.allowed) {
      const headers = buildRateLimitHeaders({ limit: 3, ...rateLimit });
      return NextResponse.json(
        {
          error: rateLimit.reason === 'backend_unavailable'
            ? 'Password reset is temporarily unavailable. Please try again shortly.'
            : 'Too many password reset attempts. Please try again in 1 hour.',
        },
        {
          status: rateLimit.reason === 'backend_unavailable' ? 503 : 429,
          headers,
        }
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
