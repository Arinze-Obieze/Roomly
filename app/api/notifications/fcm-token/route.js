import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

/**
 * POST /api/notifications/fcm-token
 * Saves an FCM token for the current user.
 */
export async function POST(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { token, deviceType = 'web' } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: user.id,
        token,
        device_type: deviceType,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, token' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FCM Token POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/fcm-token
 * Removes an FCM token (e.g., on logout).
 */
export async function DELETE(request) {
  try {
    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('token', token);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FCM Token DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
