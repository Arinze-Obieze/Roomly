import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    // Fetch user profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        full_name: profile?.full_name || user.user_metadata?.full_name,
        avatar_url: profile?.profile_picture || user.user_metadata?.avatar_url,
        phone_number: profile?.phone_number,
        bio: profile?.bio,
        date_of_birth: profile?.date_of_birth,
        is_admin: profile?.is_admin
      },
      authenticated: true,
    });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 200 }
    );
  }
}
