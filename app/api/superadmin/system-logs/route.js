import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

export async function GET(request) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  const { searchParams } = new URL(request.url);

  const page = clamp(Number(searchParams.get('page') || 1), 1, 1000000);
  const pageSize = clamp(Number(searchParams.get('pageSize') || 25), 5, 100);
  const level = searchParams.get('level');
  const service = searchParams.get('service');
  const status = searchParams.get('status');
  const q = (searchParams.get('q') || '').trim();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const hideSuperadmin = searchParams.get('hideSuperadmin');

  let superadminIds = [];
  if (hideSuperadmin === 'true') {
    const { data: admins } = await adminClient.from('users').select('id').eq('is_superadmin', true);
    if (admins?.length) {
      superadminIds = admins.map(a => a.id);
    }
  }

  let query = adminClient
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (level) query = query.eq('level', level);
  if (service) query = query.eq('service', service);
  if (status) query = query.eq('status', status);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  if (hideSuperadmin === 'true' && superadminIds.length > 0) {
    query = query.not('user_id', 'in', `(${superadminIds.join(',')})`);
  }
  if (q) {
    const escaped = q.replace(/,/g, ' ');
    query = query.or(`message.ilike.%${escaped}%,action.ilike.%${escaped}%,request_id.ilike.%${escaped}%`);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await query.range(start, end);

  if (error) {
    await logSuperadminEvent(adminClient, {
      userId: user.id,
      level: 'error',
      action: 'list_system_logs',
      status: 'failed',
      message: `Failed to fetch system logs: ${error.message}`,
      metadata: { page, pageSize, level, service, status, q, from, to },
    });

    return NextResponse.json(
      { error: error.message || 'Failed to fetch system logs.' },
      { status: 400 }
    );
  }

  await logSuperadminEvent(adminClient, {
    userId: user.id,
    level: 'debug',
    action: 'list_system_logs',
    status: 'success',
    message: `Fetched system logs page ${page}`,
    metadata: { page, pageSize, total: count || 0, level, service, status, q, from, to },
  });

  return NextResponse.json({
    page,
    pageSize,
    total: count || 0,
    logs: data || [],
  });
}
