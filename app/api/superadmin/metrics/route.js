import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { cachedFetch } from '@/core/utils/redis';
import { summarizeMatchFeatureEvents } from '@/core/services/analytics/match-metrics';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

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

export async function GET(request) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  const { searchParams } = new URL(request.url);
  const range = clamp(Number(searchParams.get('range') || 30), 7, 180);
  const payload = await cachedFetch(`superadmin:metrics:v3:${range}`, 60, async () => {
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - range);
    const rangeStartIso = rangeStart.toISOString();

    const [
      totalUsers,
      newUsersInRange,
      totalProperties,
      activeProperties,
      totalReports,
      pendingReports,
      totalLogs,
      errorLogsInRange,
      totalSupportTickets,
      openSupportTickets,
      discoveryEventsInRange,
      conversationsInRange,
      buddyGroupsInRange,
      matchFeatureEventsResult,
    ] = await Promise.all([
      safeCount(() => adminClient.from('users').select('*', { count: 'exact', head: true })),
      safeCount(() =>
        adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', rangeStartIso)
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
      safeCount(() =>
        adminClient
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('level', 'error')
          .gte('created_at', rangeStartIso)
      ),
      safeCount(() => adminClient.from('support_tickets').select('*', { count: 'exact', head: true })),
      safeCount(() =>
        adminClient.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])
      ),
      safeCount(() =>
        adminClient
          .from('feature_events')
          .select('*', { count: 'exact', head: true })
          .eq('feature_name', 'discovery')
          .gte('created_at', rangeStartIso)
      ),
      safeCount(() =>
        adminClient
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', rangeStartIso)
      ),
      safeCount(() =>
        adminClient
          .from('buddy_groups')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', rangeStartIso)
      ),
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
        .gte('created_at', rangeStartIso)
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
      range,
      metrics: {
        totalUsers,
        newUsersInRange,
        totalProperties,
        activeProperties,
        totalReports,
        pendingReports,
        totalLogs,
        errorLogsInRange,
        totalSupportTickets,
        openSupportTickets,
        discoveryEventsInRange,
        conversationsInRange,
        buddyGroupsInRange,
        matchQuality,
      },
    };
  });

  await logSuperadminEvent(adminClient, {
    request,
    userId: user.id,
    action: 'get_metrics',
    status: 'success',
    message: `Loaded superadmin dashboard metrics for ${range} day window`,
    metadata: {
      range,
      failed_metrics: Object.entries(payload.metrics)
        .filter(([, value]) => value?.ok === false)
        .map(([key]) => key),
    },
  });

  return NextResponse.json(payload);
}
