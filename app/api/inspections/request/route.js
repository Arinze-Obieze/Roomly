import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/core/utils/email';

// Initialize a Supabase admin client with the service role key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
    try {
        const body = await req.json();
        const { conversationId, propertyId, hostId, tenantId, date, time, note, seekerName, propertyTitle } = body;

        if (!conversationId || !propertyId || !hostId || !tenantId || !date || !time) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const attachmentData = {
            status: 'pending',
            date,
            time,
            note: note || '',
            property_id: propertyId
        };

        // 1. Insert the message into Supabase
        const { data: message, error: messageError } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: tenantId,
                attachment_type: 'inspection_request',
                attachment_data: attachmentData,
                is_read: false
            })
            .select()
            .single();

        if (messageError) {
            console.error('Error inserting inspection request message:', messageError);
            return NextResponse.json({ error: 'Failed to create request message' }, { status: 500 });
        }

        // 2. Update the conversation's last message snippet
        await supabaseAdmin
            .from('conversations')
            .update({
                last_message: '📅 Requested an inspection',
                last_message_at: new Date().toISOString(),
                last_message_sender_id: tenantId
            })
            .eq('id', conversationId);

        // 3. Fetch Host's email
        const { data: host, error: hostError } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', hostId)
            .single();

        // 4. Send Email Notification
        if (host && host.email) {
            const subject = `New Inspection Request: ${propertyTitle}`;
            const formattedDate = new Date(`${date}T${time}`).toLocaleString('en-IE', {
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            const htmlParams = {
                to: host.email,
                subject,
                text: `${seekerName} requested an inspection for ${propertyTitle} on ${formattedDate}. Check your RoomFind messages to Accept or Decline.`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #0891b2;">New Inspection Request</h2>
                        <p style="font-size: 16px; color: #334155;">
                            <strong>${seekerName}</strong> has requested an inspection for <strong>${propertyTitle}</strong>.
                        </p>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
                            ${note ? `<p style="margin: 0;"><strong>Note:</strong> "${note}"</p>` : ''}
                        </div>
                        <div style="margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://roomfind.ie'}/messages" style="background-color: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                                View Messages
                            </a>
                        </div>
                    </div>
                `
            };
            
            // Fire and forget email to not block the current request
            sendEmail(htmlParams).catch(err => console.error('Failed to send inspection request email', err));
        }

        return NextResponse.json({ success: true, message: message });

    } catch (error) {
        console.error('Inspection Request Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
