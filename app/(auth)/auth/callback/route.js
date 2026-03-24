import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';

async function ensureUserProfile(authUser) {
  if (!authUser?.id || !authUser?.email) return;

  const adminClient = createAdminClient();
  const metadata = authUser.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') ||
    authUser.email.split('@')[0];
  const profilePicture =
    metadata.avatar_url ||
    metadata.picture ||
    null;

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from('users')
    .select('id, full_name, profile_picture')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileLookupError) {
    throw profileLookupError;
  }

  if (!existingProfile) {
    const { error: insertError } = await adminClient.from('users').insert({
      id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      profile_picture: profilePicture,
    });

    if (insertError) {
      throw insertError;
    }

    return;
  }

  const updates = {};

  if (!existingProfile.full_name && fullName) {
    updates.full_name = fullName;
  }

  if (!existingProfile.profile_picture && profilePicture) {
    updates.profile_picture = profilePicture;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error: updateError } = await adminClient
    .from('users')
    .update(updates)
    .eq('id', authUser.id);

  if (updateError) {
    throw updateError;
  }
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth check error:', error);
        return NextResponse.redirect(
          new URL(`/auth/auth-code-error?message=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      await ensureUserProfile(user);
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(
        new URL('/auth/auth-code-error?message=Authentication failed', request.url)
      );
    }

    // URL to redirect to after code exchange completes
    return NextResponse.redirect(new URL(next, request.url));
  }

  // No auth code in query usually means a hash-token flow (#access_token=...).
  // Redirect to a client page that can read the hash and establish a session.
  return NextResponse.redirect(new URL(`/auth/confirm?next=${encodeURIComponent(next)}`, request.url));
}
