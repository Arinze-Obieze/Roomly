import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { notifySuperadmins } from '@/core/services/superadmin/superadmin-notifications';
import { logActivityEvent } from '@/core/services/observability/activity-log';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('[API Support GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const csrfValidation = await validateCSRFRequest(req);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const body = await req.json();
    const { subject, category, description, attachmentType, attachmentData } = body;

    if (!subject || !category || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        category,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // 2. Create the initial message/description
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_role: 'user',
        content: description,
        attachment_type: attachmentType,
        attachment_data: attachmentData
      });

    if (messageError) throw messageError;

    const [{ data: requesterProfile }] = await Promise.all([
      adminSupabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const requesterName = requesterProfile?.full_name || user.email || 'A user';

    try {
      await notifySuperadmins({
        actorUserId: user.id,
        type: 'system',
        title: 'New Support Ticket',
        message: `${requesterName} opened a support ticket: "${subject}"`,
        link: '/superadmin/support',
        data: { ticketId: ticket.id, category },
        channels: ['in-app', 'email'],
      });
    } catch (notificationError) {
      console.error('[API Support POST] Superadmin notification failed:', notificationError);
    }

    await logActivityEvent({
      adminClient: adminSupabase,
      request: req,
      userId: user.id,
      service: 'support',
      action: 'create_support_ticket',
      status: 'success',
      message: `Created support ticket ${ticket.id}`,
      metadata: {
        ticket_id: ticket.id,
        category,
        subject,
      },
    });

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('[API Support POST] Error:', error);
    await logActivityEvent({
      request: req,
      service: 'support',
      action: 'create_support_ticket',
      status: 'failed',
      level: 'error',
      message: `Failed to create support ticket: ${error.message || error}`,
      metadata: {},
    });
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
