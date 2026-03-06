import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

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

    return NextResponse.json({ data: message });
  } catch (error) {
    console.error('[API Support Messages POST] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
