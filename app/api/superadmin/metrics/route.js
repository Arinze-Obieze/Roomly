import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

const safeCount = async (promiseFactory) => {
  try {
    const { count, error } = await promiseFactory();
    if (error) {
      return { ok: false, value: 0, error: error.message || 'Query failed' };
    }
    return { ok: true, value: count || 0, error: null };
  } catch (error) {
    return { ok: false, value: 0, error: error?.message || 'Unexpected query failure' };
  }
};

export async function GET() {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    totalUsers,
    newUsersThisWeek,
    totalProperties,
    activeProperties,
    totalReports,
    pendingReports,
    totalLogs,
    errorLogsToday,
    totalSupportTickets,
    openSupportTickets,
  ] = await Promise.all([
    safeCount(() => adminClient.from('users').select('*', { count: 'exact', head: true })),
    safeCount(() =>
      adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString())
    ),
    safeCount(() => adminClient.from('properties').select('*', { count: 'exact', head: true })),
    safeCount(() =>
      adminClient.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ),
    safeCount(() => adminClient.from('reports').select('*', { count: 'exact', head: true })),
    safeCount(() =>
      adminClient.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ),
    safeCount(() => adminClient.from('activity_logs').select('*', { count: 'exact', head: true })),
    safeCount(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return adminClient
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'error')
        .gte('created_at', today.toISOString());
    }),
    safeCount(() => adminClient.from('support_tickets').select('*', { count: 'exact', head: true })),
    safeCount(() =>
      adminClient.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])
    ),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalUsers,
      newUsersThisWeek,
      totalProperties,
      activeProperties,
      totalReports,
      pendingReports,
      totalLogs,
      errorLogsToday,
      totalSupportTickets,
      openSupportTickets,
    },
  };

  await logSuperadminEvent(adminClient, {
    userId: user.id,
    action: 'get_metrics',
    status: 'success',
    message: 'Loaded superadmin dashboard metrics',
    metadata: {
      failed_metrics: Object.entries(payload.metrics)
        .filter(([, value]) => value?.ok === false)
        .map(([key]) => key),
    },
  });

  return NextResponse.json(payload);
}
