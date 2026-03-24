import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';

export async function POST(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await request.json().catch(() => ({}));
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: conversation, error: conversationError } = await admin
      .from('conversations')
      .select('id, tenant_id, host_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.tenant_id !== user.id && conversation.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const unreadField =
      conversation.tenant_id === user.id ? 'unread_count_tenant' : 'unread_count_host';

    const { error: markMessagesError } = await admin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (markMessagesError) {
      throw markMessagesError;
    }

    const { error: updateConversationError } = await admin
      .from('conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId);

    if (updateConversationError) {
      throw updateConversationError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Messages Mark Read POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
