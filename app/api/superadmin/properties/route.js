import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

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

    if (q) {
      const escaped = q.replace(/,/g, ' ');
      query = query.or(`title.ilike.%${escaped}%,city.ilike.%${escaped}%,street.ilike.%${escaped}%`);
    }

    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('approval_status', statusFilter);
    }

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
