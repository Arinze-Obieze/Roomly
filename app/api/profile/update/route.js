import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { ensureUserProfile } from '@/core/utils/auth/ensureUserProfile';
import { bumpCacheVersion } from '@/core/utils/redis';
import { getProfileUpdateVersionKeys } from '@/core/services/matching/matching-cache-versions';
import { normalizeUserPrivacyUpdates } from '@/core/services/users/profile-privacy';
import { normalizeUserProfileUpdates } from '@/core/services/users/profile-update';
import { upsertUserMatchingSnapshot } from '@/core/services/matching/features/snapshot.service';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { logActivityEvent } from '@/core/services/observability/activity-log';

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
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

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

    const normalizedUpdates = normalizeUserProfileUpdates(
      normalizeUserPrivacyUpdates(updates)
    );

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('users')
      .update(normalizedUpdates)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) throw error;

    await upsertUserMatchingSnapshot(admin, user.id);

    await Promise.all(
      getProfileUpdateVersionKeys(user.id).map((key) => bumpCacheVersion(key))
    );

    await logActivityEvent({
      adminClient: admin,
      request,
      userId: user.id,
      service: 'profile',
      action: 'update_profile',
      status: 'success',
      message: `Updated profile for user ${user.id}`,
      metadata: {
        updated_fields: Object.keys(normalizedUpdates),
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[profile/update PATCH]', error);
    await logActivityEvent({
      request,
      service: 'profile',
      action: 'update_profile',
      status: 'failed',
      level: 'error',
      message: `Failed to update profile: ${error?.message || error}`,
      metadata: {},
    });
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}
