import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';

export async function PATCH(request, { params }) {
  try {
    const { id: propertyId } = params;
    const body = await request.json();
    const isActive = body?.isActive;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean.' }, { status: 400 });
    }

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { adminClient, user } = guard;

    const { error } = await adminClient
      .from('properties')
      .update({ is_active: isActive })
      .eq('id', propertyId);

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
