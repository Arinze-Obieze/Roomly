import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { sanitizeLength, sanitizeText } from '@/core/utils/sanitizers';

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

    const { seekerId, propertyId, message } = await request.json();

    if (!seekerId || !propertyId) {
      return NextResponse.json({ error: 'seekerId and propertyId are required' }, { status: 400 });
    }

    const cleanedMessage = sanitizeText(sanitizeLength(message || '', 2000)).trim();
    if (!cleanedMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const [{ data: ownedProperty }, { data: seekerUser }] = await Promise.all([
      adminSupabase
        .from('properties')
        .select('id, listed_by_user_id')
        .eq('id', propertyId)
        .eq('listed_by_user_id', user.id)
        .maybeSingle(),
      adminSupabase
        .from('users')
        .select('id')
        .eq('id', seekerId)
        .maybeSingle(),
    ]);

    if (!ownedProperty) {
      return NextResponse.json({ error: 'You can only contact seekers for your own listing' }, { status: 403 });
    }

    if (!seekerUser) {
      return NextResponse.json({ error: 'Seeker not found' }, { status: 404 });
    }

    const { data: existingConversation } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('property_id', propertyId)
      .eq('tenant_id', seekerId)
      .maybeSingle();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      const { data: createdConversation, error: createConversationError } = await adminSupabase
        .from('conversations')
        .insert({
          property_id: propertyId,
          tenant_id: seekerId,
          host_id: user.id,
          last_message: cleanedMessage,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createConversationError) {
        throw createConversationError;
      }

      conversationId = createdConversation.id;
    } else {
      const { error: updateConversationError } = await adminSupabase
        .from('conversations')
        .update({
          last_message: cleanedMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (updateConversationError) {
        throw updateConversationError;
      }
    }

    const { error: messageError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: cleanedMessage,
      });

    if (messageError) {
      throw messageError;
    }

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error('[Start Seeker Conversation POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start conversation' },
      { status: 500 }
    );
  }
}
