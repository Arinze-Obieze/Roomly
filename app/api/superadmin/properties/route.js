import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { refreshPropertyMutationArtifacts } from '@/core/services/superadmin/property-mutation-refresh';
import { validateCSRFRequest } from '@/core/utils/csrf';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
const BULK_ACTIONS = {
  approve: { column: 'approval_status', value: 'approved' },
  reject: { column: 'approval_status', value: 'rejected' },
  activate: { column: 'is_active', value: true },
  suspend: { column: 'is_active', value: false },
};

function applyPropertyFilters(query, { q, approvalStatus }) {
  let nextQuery = query;

  if (q) {
    const escaped = q.replace(/,/g, ' ');
    nextQuery = nextQuery.or(`title.ilike.%${escaped}%,city.ilike.%${escaped}%,street.ilike.%${escaped}%`);
  }

  if (approvalStatus && APPROVAL_STATUSES.includes(approvalStatus)) {
    nextQuery = nextQuery.eq('approval_status', approvalStatus);
  }

  return nextQuery;
}

export async function GET(request) {
  try {
    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;
    const { searchParams } = new URL(request.url);

    const page = clamp(Number(searchParams.get('page') || 1), 1, 1000000);
    const pageSize = clamp(Number(searchParams.get('pageSize') || 25), 5, 100);
    const q = (searchParams.get('q') || '').trim();
    const statusFilter = searchParams.get('approvalStatus');

    let query = adminClient
      .from('properties')
      .select(
        `
      *,
      users:listed_by_user_id(id, full_name, email),
      property_media(url, is_primary)
    `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    query = applyPropertyFilters(query, { q, approvalStatus: statusFilter });

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Fetch properties and filter counts concurrently
    const [
      { data, error, count },
      { count: allCount },
      { count: pendingCount },
      { count: approvedCount },
      { count: rejectedCount }
    ] = await Promise.all([
      query.range(start, end),
      adminClient.from('properties').select('*', { count: 'exact', head: true }),
      adminClient.from('properties').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      adminClient.from('properties').select('*', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      adminClient.from('properties').select('*', { count: 'exact', head: true }).eq('approval_status', 'rejected')
    ]);

    if (error) {
      console.error("[GET Properties API] Supabase query error:", error);
      await logSuperadminEvent(adminClient, {
        requestId: request.headers.get('x-request-id') || null,
        userId: user.id,
        level: 'error',
        action: 'list_properties',
        status: 'failed',
        message: `Failed to load properties list: ${error.message}`,
        metadata: { query: q, page, pageSize },
      });

      return NextResponse.json({ error: error.message || 'Failed to load properties.' }, { status: 400 });
    }

    const stats = {
      all: allCount || 0,
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0
    };

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      action: 'list_properties',
      status: 'success',
      message: `Loaded properties list (${data?.length || 0} rows)`,
      metadata: { query: q, page, pageSize, total: count || 0, stats },
    });

    return NextResponse.json({ 
      page, 
      pageSize, 
      total: count || 0, 
      properties: data || [],
      stats 
    });
  } catch (err) {
    console.error("[GET Properties API] Unhandled exception:", err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;
    const body = await request.json();
    const action = body?.action;
    const propertyIds = Array.isArray(body?.propertyIds)
      ? [...new Set(body.propertyIds.map((id) => String(id)).filter(Boolean))]
      : [];
    const applyToAll = body?.applyToAll === true;
    const filters = {
      q: (body?.filters?.q || '').trim(),
      approvalStatus: body?.filters?.approvalStatus || null,
    };

    if (!BULK_ACTIONS[action]) {
      return NextResponse.json({ error: 'Invalid bulk action.' }, { status: 400 });
    }

    if (!applyToAll && propertyIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one property.' }, { status: 400 });
    }

    const { column, value } = BULK_ACTIONS[action];

    let selectionQuery = adminClient
      .from('properties')
      .select('id, title, listed_by_user_id');

    if (applyToAll) {
      selectionQuery = applyPropertyFilters(selectionQuery, filters);
    } else {
      selectionQuery = selectionQuery.in('id', propertyIds);
    }

    const { data: targetProperties, error: selectionError } = await selectionQuery;
    if (selectionError) {
      throw selectionError;
    }

    const targetIds = (targetProperties || []).map((property) => property.id);

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'No matching properties found.' }, { status: 404 });
    }

    const { error: updateError } = await adminClient
      .from('properties')
      .update({ [column]: value })
      .in('id', targetIds);

    if (updateError) {
      throw updateError;
    }

    const ownerByPropertyId = new Map(
      (targetProperties || []).map((property) => [property.id, property.listed_by_user_id])
    );

    const recomputeClient = createAdminClient();
    await Promise.allSettled(
      targetIds.map(async (propertyId) => {
        await refreshPropertyMutationArtifacts(recomputeClient, {
          propertyId,
          ownerUserId: ownerByPropertyId.get(propertyId),
        });
      })
    );

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      action: `bulk_property_${action}`,
      status: 'success',
      message: `Bulk ${action} applied to ${targetIds.length} properties`,
      metadata: {
        action,
        applyToAll,
        count: targetIds.length,
        propertyIds: targetIds,
        filters: applyToAll ? filters : null,
      },
    });

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      propertyIds: targetIds,
    });
  } catch (err) {
    console.error('[PATCH Properties API] Unhandled exception:', err);
    return NextResponse.json({ error: err.message || 'Failed to update properties.' }, { status: 500 });
  }
}
