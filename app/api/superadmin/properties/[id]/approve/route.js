import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { recomputeForProperty } from '@/core/services/matching/recompute-compatibility.service';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { bumpCacheVersion, invalidatePattern } from '@/core/utils/redis';

export async function PATCH(request, { params }) {
  const guard = await requireSuperadmin();
  if (guard.errorResponse) return guard.errorResponse;

  const { adminClient, user } = guard;
  
  // Await params first per Next.js 15+ convention for dynamic routes
  const { id: propertyId } = await params;

  try {
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await adminClient
      .from('properties')
      .update({ approval_status: newStatus })
      .eq('id', propertyId)
      .select('id, title, listed_by_user_id')
      .single();

    if (error) throw error;

    if (newStatus === 'approved') {
      try {
        await recomputeForProperty(createAdminClient(), propertyId);
      } catch (recomputeError) {
        console.error(`[Superadmin Property Approval] Recompute failed: ${recomputeError?.message || recomputeError}`);
      }
    }

    await Promise.all([
      bumpCacheVersion('v:properties:global'),
      bumpCacheVersion(`v:property:${propertyId}`),
      invalidatePattern('landlord:find_people:*'),
      invalidatePattern('seeker:find_landlords:*'),
    ]);

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      action: `property_${action}`,
      status: 'success',
      message: `Property ${propertyId} marked as ${newStatus}`,
      metadata: { propertyId, status: newStatus },
    });

    return NextResponse.json({ success: true, property: data });
  } catch (error) {
    console.error(`[Superadmin Property Approval] ${error.message}`);
    
    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      level: 'error',
      action: 'property_approval_failed',
      status: 'failed',
      message: `Failed to update property status: ${error.message}`,
      metadata: { propertyId },
    });

    return NextResponse.json(
      { error: error.message || 'Failed to update property status' },
      { status: 500 }
    );
  }
}
