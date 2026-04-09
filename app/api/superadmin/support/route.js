import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

export async function GET(request) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;

  try {
    const { data: tickets, error } = await adminClient
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

    await logSuperadminEvent(adminClient, {
      request,
      userId: user.id,
      action: 'list_support_tickets',
      status: 'success',
      message: `Loaded support tickets (${tickets?.length || 0} rows)`,
      metadata: { total: tickets?.length || 0 },
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    await logSuperadminEvent(adminClient, {
      request,
      userId: user.id,
      level: 'error',
      action: 'list_support_tickets',
      status: 'failed',
      message: `Failed to fetch support tickets: ${error.message || error}`,
      metadata: {},
    });
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

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;

    const body = await req.json();
    const { ticketId, status, priority } = body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    updates.updated_at = new Date().toISOString();

    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    await logSuperadminEvent(adminClient, {
      request: req,
      userId: user.id,
      action: 'update_support_ticket',
      status: 'success',
      message: `Updated support ticket ${ticketId}`,
      metadata: { ticket_id: ticketId, updates },
    });

    return NextResponse.json({ data: ticket });
  } catch (error) {
    const guard = await requireSuperadmin();
    if (!guard.errorResponse) {
      await logSuperadminEvent(guard.adminClient, {
        request: req,
        userId: guard.user.id,
        level: 'error',
        action: 'update_support_ticket',
        status: 'failed',
        message: `Failed to update support ticket: ${error.message || error}`,
        metadata: {},
      });
    }
    console.error('[API Admin Support PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
