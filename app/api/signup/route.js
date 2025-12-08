'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password } = body; // Note: Changed from 'phone' to match frontend

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1️⃣ Create Auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });
    
    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    const userId = signUpData.user.id;

    // 2️⃣ Insert into users table via RPC with new schema
    const { error: rpcError } = await supabase.rpc('insert_user_profile', {
      p_id: userId,
      p_email: email,
      p_full_name: fullName,
      p_phone_number: phone || null,
      p_profile_picture: null, // Can be filled later
      p_bio: null, // Can be filled later
      p_date_of_birth: null, // Can be filled later
      p_is_admin: false // Default to false for new users
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + rpcError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: 'Signup successful',
      userId: userId 
    });
  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}