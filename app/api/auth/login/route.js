import { AuthService } from '@/core/services/auth.service';
import { loginSchema } from '@/core/validations/auth.schema';
import { NextResponse } from 'next/server';
import { assertRateLimit } from '@/core/utils/rate-limit';

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

    const rateLimit = await assertRateLimit({
      request,
      key: 'auth-login',
      limit: 5,
      windowSeconds: 15 * 60,
      scope: email.toLowerCase(),
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
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
        is_superadmin: data.user.user_metadata?.is_superadmin || data.user.app_metadata?.is_superadmin || false,
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
