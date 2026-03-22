import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { sanitizeLength, sanitizeText } from '@/core/utils/sanitizers';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';

/**
 * Polymorphic endpoint to start a conversation between a Seeker and a Host
 * for a specific Property context.
 */
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

    const { targetId, propertyId, message } = await request.json();

    if (!targetId || !propertyId) {
      return NextResponse.json({ error: 'targetId and propertyId are required' }, { status: 400 });
    }

    const cleanedMessage = sanitizeText(sanitizeLength(message || '', 2000)).trim();
    if (!cleanedMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch target user and property to verify roles/ownership
    const [{ data: targetUser }, { data: property }] = await Promise.all([
      adminSupabase.from('users').select('id').eq('id', targetId).maybeSingle(),
      adminSupabase
        .from('properties')
        .select('id, listed_by_user_id, privacy_setting, is_public')
        .eq('id', propertyId)
        .maybeSingle(),
    ]);

    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    // 2. Identify roles
    const isLandlordContactingSeeker = property.listed_by_user_id === user.id;
    const isSeekerContactingLandlord = property.listed_by_user_id === targetId;

    if (!isLandlordContactingSeeker && !isSeekerContactingLandlord) {
      return NextResponse.json({ error: 'Invalid context for conversation' }, { status: 403 });
    }

    const hostId   = isLandlordContactingSeeker ? user.id : targetId;
    const tenantId = isLandlordContactingSeeker ? targetId : user.id;

    // ── Contact gate (seeker-initiated only) ────────────────────────────────
    // Mirrors the DB-level RLS policy. Using the user-scoped supabase client
    // (not adminSb) so this is consistent with what RLS would enforce.
    if (isSeekerContactingLandlord) {
      // Fail closed: if we can't prove it's public, treat as private.
      const isPrivateProp =
        property.privacy_setting === 'private' ||
        property.is_public !== true;

      const [{ data: interestRow }, { data: scoreRow }] = await Promise.all([
        supabase
          .from('property_interests')
          .select('status')
          .eq('seeker_id', user.id)
          .eq('property_id', propertyId)
          .maybeSingle(),
        supabase
          .from('compatibility_scores')
          .select('score')
          .eq('seeker_id', user.id)
          .eq('property_id', propertyId)
          .maybeSingle(),
      ]);

      const hasAcceptedInterest = interestRow?.status === 'accepted';

      if (!hasAcceptedInterest) {
        if (isPrivateProp) {
          return NextResponse.json(
            { error: 'You must have an accepted interest to contact the host of a private listing.' },
            { status: 403 }
          );
        }
        const score = scoreRow?.score ?? null;
        if (score === null || score < 51) {
          return NextResponse.json(
            { error: 'Your match score must be 51 or higher to contact this host directly. Show interest first.' },
            { status: 403 }
          );
        }
      }
    }
    // ── End contact gate ─────────────────────────────────────────────────────

    // 3. Find or Create Conversation
    const { data: existingConversation } = await adminSupabase
      .from('conversations')
      .select('id')
      .eq('property_id', propertyId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
       const { data: createdConversation, error: createError } = await adminSupabase
        .from('conversations')
        .insert({
          property_id: propertyId,
          tenant_id: tenantId,
          host_id: hostId,
          last_message: cleanedMessage,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) throw createError;
      conversationId = createdConversation.id;
    } else {
      await adminSupabase
        .from('conversations')
        .update({
          last_message: cleanedMessage,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    // 4. Insert Message
    const { error: messageError } = await adminSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: cleanedMessage,
      });

    if (messageError) throw messageError;

    // 5. Log tracking event (fire & forget)
    logFeatureEvent({
      userId: user.id,
      featureName: 'messaging',
      action: 'start_conversation',
      metadata: {
        role: isLandlordContactingSeeker ? 'host' : 'tenant',
        propertyId
      }
    }).catch(console.error);

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    console.error('[Start Conversation POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start conversation' },
      { status: 500 }
    );
  }
}
