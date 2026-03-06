import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const resendAttempts = new Map();

const checkRateLimit = (ip) => {
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX_ATTEMPTS = 5;

  if (!resendAttempts.has(ip)) {
    resendAttempts.set(ip, []);
  }

  const attempts = resendAttempts.get(ip);
  const recentAttempts = attempts.filter((time) => now - time < WINDOW);
  resendAttempts.set(ip, recentAttempts);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }

  recentAttempts.push(now);
  return true;
};

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many resend attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/+$/, '');
    const redirectUrl = `${baseUrl}/auth/confirm`;

    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Always return success to avoid email enumeration.
    return NextResponse.json({
      message: 'If an account exists and requires confirmation, a new link has been sent.',
    });
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json(
      { message: 'If an account exists and requires confirmation, a new link has been sent.' },
      { status: 200 }
    );
  }
}
