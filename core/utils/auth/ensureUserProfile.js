import { createAdminClient } from '@/core/utils/supabase/admin';

function getProfileDefaults(authUser) {
  const metadata = authUser?.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') ||
    authUser?.email?.split('@')[0] ||
    null;

  return {
    email: authUser?.email || null,
    full_name: fullName,
    phone_number: metadata.phone || authUser?.phone || null,
    profile_picture: metadata.avatar_url || metadata.picture || null,
  };
}

export async function ensureUserProfile(authUser) {
  if (!authUser?.id || !authUser?.email) return null;

  const adminClient = createAdminClient();
  const defaults = getProfileDefaults(authUser);

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from('users')
    .select('id, email, full_name, phone_number, profile_picture')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileLookupError) {
    throw profileLookupError;
  }

  if (!existingProfile) {
    const insertPayload = {
      id: authUser.id,
      ...defaults,
    };

    const { data: insertedProfile, error: insertError } = await adminClient
      .from('users')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    return insertedProfile;
  }

  const updates = {};

  if (!existingProfile.email && defaults.email) {
    updates.email = defaults.email;
  }

  if (!existingProfile.full_name && defaults.full_name) {
    updates.full_name = defaults.full_name;
  }

  if (!existingProfile.phone_number && defaults.phone_number) {
    updates.phone_number = defaults.phone_number;
  }

  if (!existingProfile.profile_picture && defaults.profile_picture) {
    updates.profile_picture = defaults.profile_picture;
  }

  if (Object.keys(updates).length === 0) {
    return existingProfile;
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from('users')
    .update(updates)
    .eq('id', authUser.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedProfile;
}
