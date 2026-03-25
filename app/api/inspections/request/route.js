import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { sendEmail } from '@/core/utils/email';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { Notifier } from '@/core/services/notifications/notifier';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export async function POST(req) {
  try {
    const csrfValidation = await validateCSRFRequest(req);
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

    const body = await req.json();
    const { conversationId, propertyId, date, time, note } = body;

    if (!conversationId || !propertyId || !date || !time) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
      return NextResponse.json({ error: 'Invalid date or time format' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: conversation, error: conversationError } = await admin
      .from('conversations')
      .select('id, property_id, tenant_id, host_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (conversation.property_id !== propertyId) {
      return NextResponse.json({ error: 'Conversation and property do not match' }, { status: 400 });
    }
    if (conversation.tenant_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the seeker in this conversation can request an inspection' },
        { status: 403 }
      );
    }

    const [{ data: property }, { data: host }, { data: seeker }] = await Promise.all([
      admin.from('properties').select('id, title').eq('id', propertyId).maybeSingle(),
      admin.from('users').select('id, email, full_name').eq('id', conversation.host_id).maybeSingle(),
      admin.from('users').select('id, full_name').eq('id', conversation.tenant_id).maybeSingle(),
    ]);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (!host) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 });
    }

    const safeNote = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
    const attachmentData = {
      status: 'pending',
      date,
      time,
      note: safeNote,
      property_id: propertyId,
    };

    const { data: message, error: messageError } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        attachment_type: 'inspection_request',
        attachment_data: attachmentData,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error inserting inspection request message:', messageError);
      return NextResponse.json({ error: 'Failed to create request message' }, { status: 500 });
    }

    await admin
      .from('conversations')
      .update({
        last_message: 'Inspection requested',
        last_message_at: new Date().toISOString(),
        last_message_sender_id: user.id,
      })
      .eq('id', conversationId);

    const seekerName = seeker?.full_name || 'A tenant';
    const propertyTitle = property.title || 'Property';
    const formattedDate = new Date(`${date}T${time}`).toLocaleString('en-IE', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    Notifier.send({
      userId: host.id,
      type: 'system',
      title: 'New Inspection Request',
      message: `${seekerName} requested an inspection for "${propertyTitle}" on ${formattedDate}.`,
      link: `/messages?conversationId=${conversationId}`,
      data: { conversationId, propertyId, messageId: message.id, status: 'pending' },
      channels: ['in-app'],
    }).catch((notifyError) => {
      console.error('Failed to send inspection request notification', notifyError);
    });

    if (host.email) {
      sendEmail({
        to: host.email,
        subject: `New Inspection Request: ${propertyTitle}`,
        text: `${seekerName} requested an inspection for ${propertyTitle} on ${formattedDate}. Check your RoomFind messages to accept or decline.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2;">New Inspection Request</h2>
            <p style="font-size: 16px; color: #334155;">
              <strong>${escapeHtml(seekerName)}</strong> has requested an inspection for <strong>${escapeHtml(propertyTitle)}</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              ${safeNote ? `<p style="margin: 0;"><strong>Note:</strong> "${escapeHtml(safeNote)}"</p>` : ''}
            </div>
            <div style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie'}/messages" style="background-color: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                View Messages
              </a>
            </div>
          </div>
        `,
      }).catch((err) => console.error('Failed to send inspection request email', err));
    }

    logFeatureEvent({
      userId: user.id,
      featureName: 'matching',
      action: 'inspection_requested',
      metadata: buildMatchAnalyticsMetadata({
        matchScore: null,
        threshold: null,
        surface: 'inspection_request',
        entityType: 'property',
        userId: user.id,
        blurred: false,
        revealState: 'revealed',
        extra: {
          target_user_id: host.id,
          property_id: propertyId,
          conversation_id: conversationId,
        },
      }),
    }).catch(console.error);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Inspection Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
