import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

/**
 * PATCH /api/profile/settings
 * Updates user privacy + notification preferences stored in the users table.
 * Columns expected (add these via Supabase dashboard if missing):
 *   show_online_status  boolean  default true
 *   show_response_time  boolean  default true
 *   notif_new_messages  boolean  default true
 *   notif_interest      boolean  default true
 *   notif_mutual_match  boolean  default true
 *   privacy_setting     text     default 'public'
 */
export async function PATCH(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const ALLOWED_FIELDS = [
      'privacy_setting',
      'show_online_status',
      'show_response_time',
      'notif_new_messages',
      'notif_interest',
      'notif_mutual_match',
    ];

    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile/settings PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
