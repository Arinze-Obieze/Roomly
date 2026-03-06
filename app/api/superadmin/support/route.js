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

    // Verify superadmin status
    const { data: profile } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_superadmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:user_id (
          full_name,
          email,
          profile_picture
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('[API Admin Support GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const csrfValidation = await validateCSRFRequest(req);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify superadmin status
    const { data: profile } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_superadmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, status, priority } = body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    updates.updated_at = new Date().toISOString();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('[API Admin Support PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
