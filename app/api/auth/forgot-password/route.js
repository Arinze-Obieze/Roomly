import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { assertRateLimit, buildRateLimitHeaders } from '@/core/utils/rate-limit';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const rateLimit = await assertRateLimit({
      request: req,
      key: 'auth-forgot-password',
      limit: 5,
      windowSeconds: 60 * 60,
      scope: [email.toLowerCase(), 'ip'],
      fallbackMode: 'deny',
    });

    if (!rateLimit.allowed) {
      const headers = buildRateLimitHeaders({ limit: 5, ...rateLimit });
      return NextResponse.json(
        {
          error: rateLimit.reason === 'backend_unavailable'
            ? 'Password reset is temporarily unavailable. Please try again shortly.'
            : 'Too many password reset requests. Please try again later.',
        },
        {
          status: rateLimit.reason === 'backend_unavailable' ? 503 : 429,
          headers,
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/+$/, '');
    const redirectUrl = `${baseUrl}/reset-password`;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'Password reset email sent successfully',
    });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
