import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/core/utils/email';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { messageId, newStatus, conversationId, updaterId, otherPartyId, propertyTitle, date, time } = body;

        if (!messageId || !newStatus || !conversationId || !updaterId || !otherPartyId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. Fetch the existing message to get its current attachment_data
        const { data: existingMessage, error: fetchError } = await supabaseAdmin
            .from('messages')
            .select('attachment_data')
            .eq('id', messageId)
            .single();

        if (fetchError || !existingMessage) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        const currentData = existingMessage.attachment_data || {};
        const updatedData = {
            ...currentData,
            status: newStatus,
        };

        // If a new date/time was proposed, update it
        if (date && time && newStatus === 'rescheduled') {
            updatedData.date = date;
            updatedData.time = time;
            updatedData.proposed_by = updaterId;
        }

        // 2. Update the message in Supabase
        const { data: updatedMessage, error: updateError } = await supabaseAdmin
            .from('messages')
            .update({ attachment_data: updatedData })
            .eq('id', messageId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating inspection message status:', updateError);
            return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
        }

        // 3. Update conversation last message preview
        let snippetText = 'Updated inspection request';
        if (newStatus === 'confirmed') snippetText = '✅ Inspection Confirmed';
        if (newStatus === 'declined') snippetText = '❌ Inspection Declined';
        if (newStatus === 'rescheduled') snippetText = '📅 Proposed new inspection time';

        await supabaseAdmin
            .from('conversations')
            .update({
                last_message: snippetText,
                last_message_at: new Date().toISOString(),
                last_message_sender_id: updaterId
            })
            .eq('id', conversationId);


        // 4. Send Email Notification to the other party
        const { data: otherParty } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', otherPartyId)
            .single();

        if (otherParty && otherParty.email) {
            let emailSubject = '';
            let emailHeader = '';
            let emailBody = '';
            const actionDate = new Date(`${updatedData.date}T${updatedData.time}`).toLocaleString('en-IE', {
                weekday: 'long', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
            });

            if (newStatus === 'confirmed') {
                emailSubject = `Inspection Confirmed: ${propertyTitle}`;
                emailHeader = 'Inspection Confirmed! ✅';
                emailBody = `Your inspection for <strong>${propertyTitle}</strong> has been confirmed for <strong>${actionDate}</strong>.`;
            } else if (newStatus === 'declined') {
                emailSubject = `Inspection Declined: ${propertyTitle}`;
                emailHeader = 'Inspection Declined ❌';
                emailBody = `The inspection request for <strong>${propertyTitle}</strong> on ${actionDate} was declined.`;
            } else if (newStatus === 'rescheduled') {
                emailSubject = `New Time Proposed for Inspection: ${propertyTitle}`;
                emailHeader = 'New Inspection Time Proposed 📅';
                emailBody = `A new time has been proposed for your inspection of <strong>${propertyTitle}</strong>. The new proposed time is <strong>${actionDate}</strong>.`;
            }

            if (emailSubject) {
                const htmlParams = {
                    to: otherParty.email,
                    subject: emailSubject,
                    text: `${emailHeader}. Check your messages on RoomFind.`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #0891b2;">${emailHeader}</h2>
                            <p style="font-size: 16px; color: #334155;">
                                ${emailBody}
                            </p>
                            <div style="margin: 30px 0;">
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie'}/messages" style="background-color: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                                    View Messages
                                </a>
                            </div>
                        </div>
                    `
                };
                sendEmail(htmlParams).catch(err => console.error('Failed to send status email', err));
            }
        }

        return NextResponse.json({ success: true, message: updatedMessage });

    } catch (error) {
        console.error('Inspection Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
