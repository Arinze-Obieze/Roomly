import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { sanitizeLength, sanitizeText } from '@/core/utils/sanitizers';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';
import { shouldLogFirstReply } from '@/core/services/messaging/first-reply';
import { Notifier } from '@/core/services/notifications/notifier';

export async function POST(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      conversationId,
      content,
      attachmentType = null,
      attachmentData = null,
    } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const cleanedContent = sanitizeText(sanitizeLength(content || '', 2000)).trim();
    const hasAttachment = !!attachmentType;

    if (!cleanedContent && !hasAttachment) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: conversation, error: conversationError } = await adminSupabase
      .from('conversations')
      .select('id, tenant_id, host_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.tenant_id !== user.id && conversation.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [{ count: existingMessagesCount }, { count: existingSenderMessagesCount }] = await Promise.all([
      adminSupabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId),
      adminSupabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .eq('sender_id', user.id),
    ]);

    const fallbackLastMessage = attachmentType === 'image'
      ? 'Shared an image'
      : attachmentType === 'file'
        ? 'Shared a file'
        : 'Sent a message';

    const { data: message, error: messageError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: cleanedContent || null,
        attachment_type: attachmentType,
        attachment_data: attachmentData,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    const { error: updateError } = await adminSupabase
      .from('conversations')
      .update({
        last_message: cleanedContent || fallbackLastMessage,
        last_message_at: message.created_at,
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    const recipientId =
      conversation.tenant_id === user.id ? conversation.host_id : conversation.tenant_id;

    Notifier.send({
      userId: recipientId,
      type: 'message',
      title: 'New Message',
      message: cleanedContent || fallbackLastMessage,
      link: `/messages?conversationId=${conversationId}`,
      data: { conversationId },
      channels: ['in-app', 'email', 'push'],
    }).catch((notifyError) => {
      console.error('[Messages Send POST] Notification Error:', notifyError);
    });

    if (shouldLogFirstReply({ existingMessagesCount, existingSenderMessagesCount })) {
      logFeatureEvent({
        userId: user.id,
        featureName: 'messaging',
        action: 'first_reply',
        metadata: buildMatchAnalyticsMetadata({
          surface: 'conversation_reply',
          entityType: 'conversation',
          userId: user.id,
          blurred: false,
          revealState: 'revealed',
          extra: {
            conversation_id: conversationId,
            recipient_user_id: recipientId,
            attachment_type: attachmentType || null,
          },
        }),
      }).catch((analyticsError) => {
        console.error('[Messages Send POST] Analytics Error:', analyticsError);
      });
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error('[Messages Send POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
