import { NextResponse } from 'next/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { Notifier } from '@/core/services/notifications/notifier';

/**
 * POST /api/notifications/webhook-handler
 * Receives database events from Supabase to trigger notifications.
 * Secured via a WEBHOOK_SECRET.
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { table, type, record, old_record } = payload;

    const supabase = createAdminClient();

    // 1. Handle New Messages
    if (table === 'messages' && type === 'INSERT') {
      // Find the recipient from the conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('tenant_id, host_id')
        .eq('id', record.conversation_id)
        .single();

      if (conversation) {
        const recipientId = record.sender_id === conversation.tenant_id 
          ? conversation.host_id 
          : conversation.tenant_id;

        await Notifier.send({
          userId: recipientId,
          type: 'message',
          title: 'New Message',
          message: record.content.length > 100 
            ? record.content.substring(0, 97) + '...' 
            : record.content,
          link: `/dashboard/chat?id=${record.conversation_id}`,
          data: { conversationId: record.conversation_id },
          channels: ['in-app', 'email', 'push']
        });
      }
    }

    // 2. Handle Buddy Invitations (External)
    // Handled in existing API for now, but could be moved here if we want DB-level triggering

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notification Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
