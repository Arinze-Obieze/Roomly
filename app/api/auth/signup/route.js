import { AuthService } from '@/core/services/auth.service';
import { signupSchema } from '@/core/validations/auth.schema';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assertRateLimit } from '@/core/utils/rate-limit';

export async function POST(req) {
  try {
    const rateLimit = await assertRateLimit({
      request: req,
      key: 'auth-signup',
      limit: 10,
      windowSeconds: 60 * 60,
      scope: 'ip',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts from this IP. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();

    // Validation
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { fullName, email, phone, password } = validation.data;

    let signUpData;
    try {
        const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/+$/, '');
        const redirectUrl = `${baseUrl}/auth/confirm`;
        signUpData = await AuthService.signup({ email, password, fullName, phone, redirectUrl });
    } catch (error) {
        if (error.code === 'DUPLICATE_EMAIL') {
             return NextResponse.json(
                { 
                    error: error.message,
                    isDuplicate: true 
                },
                { status: 400 }
            );
        }
         return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    // 3️⃣ Set session cookies if session exists (auto-confirm is enabled)
    if (signUpData.session) {
      const cookieStore = await cookies();
      // Access token expires in 1 hour (standard JWT), refresh token allows longer session
      const accessTokenMaxAge = 60 * 60; // 1 hour
      const refreshTokenMaxAge = 60 * 60 * 24 * 30; // 30 days

      cookieStore.set('sb-access-token', signUpData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: accessTokenMaxAge,
        path: '/',
      });

      cookieStore.set('sb-refresh-token', signUpData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge,
        path: '/',
      });
    }

    return NextResponse.json({ 
      message: 'Signup successful',
      userId: signUpData.user.id,
      requiresEmailConfirmation: !signUpData.session
    });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
