import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { Notifier } from '@/core/services/notifications/notifier';
import { notifySuperadmins } from '@/core/services/superadmin/superadmin-notifications';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS will handle the security if implemented correctly in the DB, 
    // but we can also double check ticket ownership if we wanted.
    const { data: messages, error } = await supabase
      .from('support_messages')
      .select(`
        *,
        sender:sender_id (
          full_name,
          profile_picture
        )
      `)
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error('[API Support Messages GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const csrfValidation = await validateCSRFRequest(req);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { content, attachmentType, attachmentData } = await req.json();
    if (!content && !attachmentData) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin to determine role
    const { data: profile } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    const role = profile?.is_superadmin ? 'admin' : 'user';

    const { data: message, error } = await supabase.from('support_messages').insert({
      ticket_id: id,
      sender_id: user.id,
      sender_role: role,
      content,
      attachment_type: attachmentType,
      attachment_data: attachmentData
    }).select().single();

    if (error) throw error;

    // Update ticket's updated_at timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // 6. Notify User if Admin replied
    if (role === 'admin') {
      try {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select('user_id, subject')
          .eq('id', id)
          .single();

        if (ticket) {
          await Notifier.send({
            userId: ticket.user_id,
            type: 'system',
            title: 'Support Update',
            message: `An admin has responded to your ticket: "${ticket.subject}"`,
            link: `/dashboard/support?id=${id}`,
            data: { ticketId: id },
            channels: ['in-app', 'email', 'push']
          });
        }
      } catch (nError) {
        console.error('[Support Reply Notification Error]:', nError);
      }
    }

    if (role === 'user') {
      try {
        const [{ data: ticket }, { data: senderProfile }] = await Promise.all([
          supabase
            .from('support_tickets')
            .select('id, subject')
            .eq('id', id)
            .single(),
          supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle(),
        ]);

        const senderName = senderProfile?.full_name || user.email || 'A user';

        await notifySuperadmins({
          actorUserId: user.id,
          type: 'system',
          title: 'Support Ticket Reply',
          message: `${senderName} replied to ticket: "${ticket?.subject || id}"`,
          link: '/superadmin/support',
          data: { ticketId: id },
          channels: ['in-app', 'email'],
        });
      } catch (nError) {
        console.error('[Support User Reply Notification Error]:', nError);
      }
    }

    return NextResponse.json({ data: message });
  } catch (error) {
    console.error('[API Support Messages POST] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
