import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const path = searchParams.get('path');
    const expiresIn = Math.min(60 * 30, Math.max(30, Number(searchParams.get('expiresIn') || 600))); // 30s–30m

    if (!groupId || !path) {
      return NextResponse.json({ error: 'groupId and path are required' }, { status: 400 });
    }
    if (!path.startsWith(`${groupId}/`)) {
      return NextResponse.json({ error: 'Invalid attachment path' }, { status: 400 });
    }

    // Verify membership (RLS should enforce, but we explicitly check for clarity)
    const { data: member } = await supabase
      .from('buddy_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: msgRef } = await supabase
      .from('buddy_messages')
      .select('id')
      .eq('group_id', groupId)
      .filter('attachment_data->>path', 'eq', path)
      .maybeSingle();

    if (!msgRef) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from('buddy_attachments')
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn });
  } catch (error) {
    console.error('[Buddy Attachment URL] Error:', error);
    return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
  }
}
