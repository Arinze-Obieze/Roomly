import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { ensureUserProfile } from '@/core/utils/auth/ensureUserProfile';
import { invalidatePattern } from '@/core/utils/redis';

const ALLOWED_FIELDS = [
  'full_name',
  'phone_number',
  'bio',
  'date_of_birth',
  'gender',
  'privacy_setting',
  'profile_picture',
  'show_online_status',
  'show_response_time',
  'notif_new_messages',
  'notif_interest',
  'notif_mutual_match',
];

export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserProfile(user);

    const body = await request.json().catch(() => ({}));
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) throw error;

    await invalidatePattern('properties:list:*');
    await invalidatePattern('property:*');
    await invalidatePattern('seeker:interests:*');
    await invalidatePattern('landlord:interests:*');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[profile/update PATCH]', error);
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}
