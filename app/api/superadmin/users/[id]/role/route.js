import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { validateCSRFRequest } from '@/core/utils/csrf';

export async function PATCH(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: targetUserId } = params;
    const body = await request.json();
    const isSuperAdmin = body?.isSuperAdmin;

    if (typeof isSuperAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'isSuperAdmin must be a boolean.' },
        { status: 400 }
      );
    }

    const { user: authUser, adminClient, errorResponse } = await requireSuperadmin();
    if (errorResponse) {
      return errorResponse;
    }

    if (!isSuperAdmin) {
      if (targetUserId === authUser.id) {
        return NextResponse.json(
          { error: 'You cannot remove your own superadmin access.' },
          { status: 400 }
        );
      }

      const { data: targetUser, error: targetError } = await adminClient
        .from('users')
        .select('id, is_superadmin')
        .eq('id', targetUserId)
        .maybeSingle();

      if (targetError || !targetUser) {
        return NextResponse.json(
          { error: 'Target user not found.' },
          { status: 404 }
        );
      }

      if (targetUser.is_superadmin) {
        const { count, error: countError } = await adminClient
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_superadmin', true);

        if (countError) {
          return NextResponse.json(
            { error: 'Failed to validate superadmin count.' },
            { status: 500 }
          );
        }

        if ((count || 0) <= 1) {
          return NextResponse.json(
            { error: 'Cannot revoke the last superadmin account.' },
            { status: 400 }
          );
        }
      }
    }

    const { error: updateError } = await adminClient
      .from('users')
      .update({ is_superadmin: isSuperAdmin })
      .eq('id', targetUserId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update superadmin role.' },
        { status: 500 }
      );
    }

    const { data: authRow, error: authRowError } = await adminClient.auth.admin.getUserById(targetUserId);
    if (!authRowError && authRow?.user) {
      const existingUserMetadata = authRow.user.user_metadata || {};
      const existingAppMetadata = authRow.user.app_metadata || {};

      const { error: metadataError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...existingUserMetadata,
          is_superadmin: isSuperAdmin,
        },
        app_metadata: {
          ...existingAppMetadata,
          is_superadmin: isSuperAdmin,
        },
      });

      if (metadataError) {
        console.warn('Updated users.is_superadmin but failed to update auth metadata:', metadataError.message);
      }
    }

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: authUser.id,
      action: 'update_user_role',
      status: 'success',
      message: `Set user ${targetUserId} superadmin=${isSuperAdmin}`,
      metadata: {
        target_user_id: targetUserId,
        is_superadmin: isSuperAdmin,
      },
    });

    return NextResponse.json({ success: true, is_superadmin: isSuperAdmin });
  } catch (error) {
    console.error('Superadmin role update error:', error);
    return NextResponse.json(
      { error: 'Unexpected error while updating role.' },
      { status: 500 }
    );
  }
}
