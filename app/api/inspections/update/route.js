import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { sendEmail } from '@/core/utils/email';
import { validateCSRFRequest } from '@/core/utils/csrf';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const ALLOWED_STATUSES = new Set(['confirmed', 'declined', 'rescheduled']);

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
    const { messageId, newStatus, conversationId, date, time } = body;

    if (!messageId || !newStatus || !conversationId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(newStatus)) {
      return NextResponse.json({ error: 'Invalid inspection status' }, { status: 400 });
    }
    if (newStatus === 'rescheduled' && (!DATE_RE.test(date || '') || !TIME_RE.test(time || ''))) {
      return NextResponse.json({ error: 'A valid date and time are required to reschedule' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: conversation, error: conversationError } = await admin
      .from('conversations')
      .select('id, tenant_id, host_id, property_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (conversation.tenant_id !== user.id && conversation.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: existingMessage, error: fetchError } = await admin
      .from('messages')
      .select('id, conversation_id, attachment_type, attachment_data')
      .eq('id', messageId)
      .single();

    if (fetchError || !existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (existingMessage.conversation_id !== conversationId || existingMessage.attachment_type !== 'inspection_request') {
      return NextResponse.json({ error: 'Invalid inspection message context' }, { status: 400 });
    }

    const currentData = existingMessage.attachment_data || {};
    const updatedData = {
      ...currentData,
      status: newStatus,
    };

    if (newStatus === 'rescheduled') {
      updatedData.date = date;
      updatedData.time = time;
      updatedData.proposed_by = user.id;
    }

    const { data: updatedMessage, error: updateError } = await admin
      .from('messages')
      .update({ attachment_data: updatedData })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating inspection message status:', updateError);
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
    }

    let snippetText = 'Updated inspection request';
    if (newStatus === 'confirmed') snippetText = 'Inspection confirmed';
    if (newStatus === 'declined') snippetText = 'Inspection declined';
    if (newStatus === 'rescheduled') snippetText = 'Proposed new inspection time';

    await admin
      .from('conversations')
      .update({
        last_message: snippetText,
        last_message_at: new Date().toISOString(),
        last_message_sender_id: user.id,
      })
      .eq('id', conversationId);

    const otherPartyId = user.id === conversation.host_id ? conversation.tenant_id : conversation.host_id;
    const [{ data: otherParty }, { data: property }] = await Promise.all([
      admin.from('users').select('email, full_name').eq('id', otherPartyId).single(),
      admin.from('properties').select('title').eq('id', conversation.property_id).maybeSingle(),
    ]);

    if (otherParty?.email) {
      const propertyTitle = property?.title || 'Property';
      const actionDate = new Date(`${updatedData.date}T${updatedData.time}`).toLocaleString('en-IE', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      let emailSubject = '';
      let emailHeader = '';
      let emailBody = '';

      if (newStatus === 'confirmed') {
        emailSubject = `Inspection Confirmed: ${propertyTitle}`;
        emailHeader = 'Inspection Confirmed';
        emailBody = `Your inspection for <strong>${escapeHtml(propertyTitle)}</strong> has been confirmed for <strong>${actionDate}</strong>.`;
      } else if (newStatus === 'declined') {
        emailSubject = `Inspection Declined: ${propertyTitle}`;
        emailHeader = 'Inspection Declined';
        emailBody = `The inspection request for <strong>${escapeHtml(propertyTitle)}</strong> on ${actionDate} was declined.`;
      } else if (newStatus === 'rescheduled') {
        emailSubject = `New Time Proposed for Inspection: ${propertyTitle}`;
        emailHeader = 'New Inspection Time Proposed';
        emailBody = `A new time has been proposed for your inspection of <strong>${escapeHtml(propertyTitle)}</strong>. The new proposed time is <strong>${actionDate}</strong>.`;
      }

      if (emailSubject) {
        sendEmail({
          to: otherParty.email,
          subject: emailSubject,
          text: `${emailHeader}. Check your messages on RoomFind.`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0891b2;">${escapeHtml(emailHeader)}</h2>
              <p style="font-size: 16px; color: #334155;">
                ${emailBody}
              </p>
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie'}/messages" style="background-color: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                  View Messages
                </a>
              </div>
            </div>
          `,
        }).catch((err) => console.error('Failed to send status email', err));
      }
    }

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('Inspection Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
