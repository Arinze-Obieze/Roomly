import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const path = searchParams.get('path');
    const expiresIn = Math.min(60 * 30, Math.max(30, Number(searchParams.get('expiresIn') || 600))); // 30s–30m

    if (!conversationId || !path) {
      return NextResponse.json({ error: 'conversationId and path are required' }, { status: 400 });
    }

    // Path must be scoped to the conversation folder to avoid arbitrary object access.
    if (!path.startsWith(`${conversationId}/`)) {
      return NextResponse.json({ error: 'Invalid attachment path' }, { status: 400 });
    }

    // Verify the requester is a participant (RLS-enforced)
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: msgRef } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .filter('attachment_data->>path', 'eq', path)
      .maybeSingle();

    if (!msgRef) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from('message_attachments')
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn });
  } catch (error) {
    console.error('[Messages Attachment URL] Error:', error);
    return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
  }
}
