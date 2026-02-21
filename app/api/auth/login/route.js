import { AuthService } from '@/core/services/auth.service';
import { loginSchema } from '@/core/validations/auth.schema';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (for development; use Redis in production)
const loginAttempts = new Map();

const checkRateLimit = (email) => {
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;

  if (!loginAttempts.has(email)) {
    loginAttempts.set(email, []);
  }

  const attempts = loginAttempts.get(email);
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < WINDOW);
  loginAttempts.set(email, recentAttempts);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  recentAttempts.push(now);
  return true; // Allowed
};

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { data, error } = await AuthService.login(email, password);

    if (error) {
      console.error('Supabase login error:', error);
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.fullName,
        user_metadata: data.user.user_metadata,
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}