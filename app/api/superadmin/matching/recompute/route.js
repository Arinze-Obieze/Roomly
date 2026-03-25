import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import {
  MATCHING_RECOMPUTE_SCOPES,
  runBulkMatchingRecompute,
} from '@/core/services/matching/bulk-recompute.service';
import { getBulkMatchingRecomputeVersionKeys } from '@/core/services/matching/matching-cache-versions';
import { bumpCacheVersion } from '@/core/utils/redis';

export async function POST(request) {
  try {
    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;
    const body = await request.json().catch(() => ({}));
    const scope = body?.scope || MATCHING_RECOMPUTE_SCOPES.approved_properties;
    const concurrency = Number(body?.concurrency) || 10;
    const limit = Number(body?.limit) || null;

    if (!Object.values(MATCHING_RECOMPUTE_SCOPES).includes(scope)) {
      return NextResponse.json({ error: 'Invalid recompute scope.' }, { status: 400 });
    }

    const results = await runBulkMatchingRecompute(adminClient, {
      scope,
      concurrency,
      limit,
    });

    await Promise.all(
      getBulkMatchingRecomputeVersionKeys().map((key) => bumpCacheVersion(key))
    );

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      action: 'bulk_matching_recompute',
      status: 'success',
      message: `Bulk matching recompute completed for ${results.requested} targets`,
      metadata: {
        scope,
        concurrency,
        limit,
        results,
      },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[Superadmin Matching Recompute] Error:', error);

    try {
      const guard = await requireSuperadmin();
      if (!guard.errorResponse) {
        await logSuperadminEvent(guard.adminClient, {
          requestId: request.headers.get('x-request-id') || null,
          userId: guard.user.id,
          level: 'error',
          action: 'bulk_matching_recompute',
          status: 'failed',
          message: `Bulk matching recompute failed: ${error.message || error}`,
          metadata: {},
        });
      }
    } catch {
      // ignore audit failure
    }

    return NextResponse.json({ error: error.message || 'Failed to recompute matching.' }, { status: 500 });
  }
}
