import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { sanitizeLength, sanitizeText } from '@/core/utils/sanitizers';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { Notifier } from '@/core/services/notifications/notifier';
import { getPropertyContactState } from '@/core/services/matching/rules/property-visibility';
import { getPeopleContactState } from '@/core/services/matching/presentation/people-discovery-state';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';

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
    let matchingContext = {
      matchScore: null,
      threshold: null,
      entityType: null,
    };

    // 1. Fetch target user and property to verify roles/ownership
    const [{ data: targetUser }, { data: property }] = await Promise.all([
      adminSupabase
        .from('users')
        .select('id, privacy_setting, profile_visibility')
        .eq('id', targetId)
        .maybeSingle(),
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
      const contactState = getPropertyContactState({
        property,
        hasAcceptedInterest,
        matchScore: scoreRow?.score ?? null,
        missingProfile: false,
      });

      if (!contactState.contactAllowed) {
        const message = contactState.isPrivate
          ? 'You must have an accepted interest to contact the host of a private listing.'
          : 'Your match score must be 51 or higher to contact this host directly. Show interest first.';
        return NextResponse.json({ error: message }, { status: 403 });
      }

      matchingContext = {
        matchScore: scoreRow?.score ?? null,
        threshold: contactState.isPrivate ? 70 : 51,
        entityType: 'property',
      };
    }

    if (isLandlordContactingSeeker) {
      const [{ data: interestRow }, { data: peopleInterestRows }] = await Promise.all([
        supabase
          .from('property_interests')
          .select('status')
          .eq('seeker_id', targetId)
          .eq('property_id', propertyId)
          .maybeSingle(),
        supabase
          .from('people_interests')
          .select('status')
          .eq('status', 'accepted')
          .eq('context_property_id', propertyId)
          .or(
            [
              `and(initiator_user_id.eq.${user.id},target_user_id.eq.${targetId})`,
              `and(initiator_user_id.eq.${targetId},target_user_id.eq.${user.id})`,
            ].join(',')
          )
          .limit(1),
      ]);

      const contactState = getPeopleContactState({
        subject: targetUser,
        hasRevealRelationship:
          interestRow?.status === 'accepted' || (peopleInterestRows || []).length > 0,
      });

      if (!contactState.contactAllowed) {
        return NextResponse.json(
          { error: 'This private seeker profile must accept interest before direct contact is allowed.' },
          { status: 403 }
        );
      }

      matchingContext = {
        matchScore: null,
        threshold: 70,
        entityType: 'person',
      };
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
          started_by_user_id: user.id,
          last_message: cleanedMessage,
          last_message_at: new Date().toISOString(),
          last_message_sender_id: user.id,
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
          last_message_sender_id: user.id,
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

    const recipientId = user.id === hostId ? tenantId : hostId;
    const notificationTitle = existingConversation ? 'New Message' : 'New Conversation';

    Notifier.send({
      userId: recipientId,
      type: 'message',
      title: notificationTitle,
      message: cleanedMessage,
      link: `/messages?conversationId=${conversationId}`,
      data: { conversationId, propertyId },
      channels: ['in-app', 'email', 'push'],
    }).catch((notifyError) => {
      console.error('[Start Conversation POST] Notification Error:', notifyError);
    });

    // 5. Log tracking event (fire & forget)
    logFeatureEvent({
      userId: user.id,
      featureName: 'messaging',
      action: 'start_conversation',
      metadata: {
        role: isLandlordContactingSeeker ? 'host' : 'tenant',
        propertyId,
        ...buildMatchAnalyticsMetadata({
          matchScore: matchingContext.matchScore,
          threshold: matchingContext.threshold,
          surface: 'conversation_start',
          entityType: matchingContext.entityType || (isLandlordContactingSeeker ? 'person' : 'property'),
          userId: user.id,
          blurred: false,
          revealState: 'revealed',
          extra: {
            target_user_id: targetId,
          },
        }),
      },
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
