import { AuthService } from '@/core/services/auth.service';
import { signupSchema } from '@/core/validations/auth.schema';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
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
        const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`;
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
      const maxAge = 60 * 60 * 24 * 7; // 7 days

      cookieStore.set('sb-access-token', signUpData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/',
      });

      cookieStore.set('sb-refresh-token', signUpData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
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