import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { cachedFetch } from '@/core/utils/redis';
import { summarizeMatchFeatureEvents } from '@/core/services/analytics/match-metrics';

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
  const payload = await cachedFetch('superadmin:metrics:v2', 60, async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sevenDaysAgoIso = oneWeekAgo.toISOString();

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
      discoveryEventsToday,
      conversationsToday,
      buddyGroupsToday,
      matchFeatureEventsResult,
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
      safeCount(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return adminClient
          .from('feature_events')
          .select('*', { count: 'exact', head: true })
          .eq('feature_name', 'discovery')
          .gte('created_at', today.toISOString());
      }),
      safeCount(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return adminClient
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
      }),
      safeCount(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return adminClient
          .from('buddy_groups')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
      }),
      adminClient
        .from('feature_events')
        .select('action, metadata, created_at')
        .in('action', [
          'property_impression',
          'result_impression',
          'property_click',
          'result_profile_open',
          'show_property_interest',
          'show_people_interest',
          'interest_accepted',
          'inspection_requested',
          'inspection_confirmed',
          'start_conversation',
          'first_reply',
        ])
        .gte('created_at', sevenDaysAgoIso)
        .limit(5000),
    ]);

    const matchQuality = matchFeatureEventsResult.error
      ? {
          ok: false,
          value: null,
          error: matchFeatureEventsResult.error.message || 'Failed to load match analytics',
        }
      : {
          ok: true,
          value: summarizeMatchFeatureEvents(matchFeatureEventsResult.data || []),
          error: null,
        };

    return {
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
        discoveryEventsToday,
        conversationsToday,
        buddyGroupsToday,
        matchQuality,
      },
    };
  });

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
