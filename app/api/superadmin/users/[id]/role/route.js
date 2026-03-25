import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { validateSuperadminRoleChange } from '@/core/services/superadmin/role-management';
import { verifySuperadminPassword } from '@/core/services/superadmin/verify-superadmin-password';

export async function PATCH(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const isSuperAdmin = body?.isSuperAdmin;
    const password = body?.password;

    const { user: authUser, adminClient, errorResponse } = await requireSuperadmin();
    if (errorResponse) {
      return errorResponse;
    }

    const passwordCheck = await verifySuperadminPassword(authUser.email, password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 403 });
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

    let superadminCount = null;
    if (!isSuperAdmin && targetUser.is_superadmin) {
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
        superadminCount = count || 0;
      }
    }

    const validation = validateSuperadminRoleChange({
      actorUserId: authUser.id,
      targetUserId,
      currentIsSuperadmin: targetUser.is_superadmin,
      nextIsSuperadmin: isSuperAdmin,
      currentSuperadminCount: superadminCount,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
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
    if (authRowError || !authRow?.user) {
      await adminClient
        .from('users')
        .update({ is_superadmin: targetUser.is_superadmin })
        .eq('id', targetUserId);

      return NextResponse.json(
        { error: authRowError?.message || 'Failed to load auth user for metadata sync.' },
        { status: 500 }
      );
    }

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
      await adminClient
        .from('users')
        .update({ is_superadmin: targetUser.is_superadmin })
        .eq('id', targetUserId);

      return NextResponse.json(
        { error: metadataError.message || 'Failed to sync superadmin metadata.' },
        { status: 500 }
      );
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
