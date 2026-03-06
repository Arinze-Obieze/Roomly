import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

export async function GET() {
  try {
    const supabase = await createClient();
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

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('[API Support POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
