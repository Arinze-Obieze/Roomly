import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { validateCSRFRequest } from '@/core/utils/csrf';

const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

export async function GET(request) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  let query = adminClient
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    await logSuperadminEvent(adminClient, {
      request,
      userId: user.id,
      level: 'error',
      action: 'list_reports',
      status: 'failed',
      message: `Failed to load reports: ${error.message}`,
      metadata: { filter_status: status },
    });

    return NextResponse.json({ error: error.message || 'Failed to load reports.' }, { status: 400 });
  }

  await logSuperadminEvent(adminClient, {
    request,
    userId: user.id,
    action: 'list_reports',
    status: 'success',
    message: `Loaded reports list (${data?.length || 0} rows)`,
    metadata: { filter_status: status, total: data?.length || 0 },
  });

  return NextResponse.json({ reports: data || [] });
}

export async function PATCH(request) {
  const csrfValidation = await validateCSRFRequest(request);
  if (!csrfValidation.valid) {
    return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
  }

  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;

  try {
    const body = await request.json().catch(() => ({}));
    const reportId = body?.reportId ? String(body.reportId) : '';
    const newStatus = body?.status ? String(body.status) : '';

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required.' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid report status.' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId)
      .select('id, status, reported_item_type, reported_item_id')
      .single();

    if (error) {
      await logSuperadminEvent(adminClient, {
        request,
        userId: user.id,
        level: 'error',
        action: 'update_report_status',
        status: 'failed',
        message: `Failed to update report ${reportId}: ${error.message}`,
        metadata: { report_id: reportId, status: newStatus },
      });

      return NextResponse.json({ error: error.message || 'Failed to update report.' }, { status: 400 });
    }

    await logSuperadminEvent(adminClient, {
      request,
      userId: user.id,
      action: 'update_report_status',
      status: 'success',
      message: `Updated report ${reportId} to ${newStatus}`,
      metadata: {
        report_id: data.id,
        status: data.status,
        reported_item_type: data.reported_item_type,
        reported_item_id: data.reported_item_id,
      },
    });

    return NextResponse.json({ success: true, report: data });
  } catch (error) {
    await logSuperadminEvent(adminClient, {
      request,
      userId: user.id,
      level: 'error',
      action: 'update_report_status',
      status: 'failed',
      message: `Unexpected report moderation error: ${error.message || error}`,
      metadata: {},
    });

    return NextResponse.json({ error: 'Failed to update report.' }, { status: 500 });
  }
}
