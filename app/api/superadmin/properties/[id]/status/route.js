import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { refreshPropertyMutationArtifacts } from '@/core/services/superadmin/property-mutation-refresh';
import { validateCSRFRequest } from '@/core/utils/csrf';

export async function PATCH(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: propertyId } = await params;
    const body = await request.json();
    const isActive = body?.isActive;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean.' }, { status: 400 });
    }

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;

    const { data: property, error } = await adminClient
      .from('properties')
      .update({ is_active: isActive })
      .eq('id', propertyId)
      .select('id, listed_by_user_id, approval_status')
      .single();

    if (error) {
      await logSuperadminEvent(adminClient, {
        requestId: request.headers.get('x-request-id') || null,
        userId: user.id,
        level: 'error',
        action: 'update_property_status',
        status: 'failed',
        message: `Failed to update property ${propertyId} status: ${error.message}`,
        metadata: { property_id: propertyId, is_active: isActive },
      });

      return NextResponse.json(
        { error: error.message || 'Failed to update property status.' },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();
      await refreshPropertyMutationArtifacts(admin, {
        propertyId,
        ownerUserId: property?.listed_by_user_id,
      });
    } catch (refreshError) {
      console.error('[Superadmin Property Status] Artifact refresh failed:', refreshError?.message || refreshError);
    }

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: user.id,
      action: 'update_property_status',
      status: 'success',
      message: `Updated property ${propertyId} status to is_active=${isActive}`,
      metadata: { property_id: propertyId, is_active: isActive },
    });

    return NextResponse.json({ success: true, is_active: isActive });
  } catch (error) {
    console.error('Property status update error:', error);
    return NextResponse.json(
      { error: 'Unexpected error while updating property status.' },
      { status: 500 }
    );
  }
}
