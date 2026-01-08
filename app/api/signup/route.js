import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password } = body;

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client with service role key (SAFE - server-only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1️⃣ Create Auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    });
    
    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    const userId = signUpData.user.id;

    // 2️⃣ Insert into users table via RPC
    const { error: rpcError } = await supabase.rpc('insert_user_profile', {
      p_id: userId,
      p_email: email,
      p_full_name: fullName,
      p_phone_number: phone || null,
      p_profile_picture: null,
      p_bio: null,
      p_date_of_birth: null,
      p_is_admin: false
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      
      // Check if it's a duplicate email error
      if (rpcError.code === '23505' && rpcError.message.includes('email')) {
        // Attempt to clean up auth user
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { 
            error: 'This email is already registered. Please log in or reset your password if you forgot it.',
            isDuplicate: true 
          },
          { status: 400 }
        );
      }
      
      // Attempt to clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
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
      userId: userId,
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