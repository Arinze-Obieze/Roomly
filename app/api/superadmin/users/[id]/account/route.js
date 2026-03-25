import { NextResponse } from 'next/server';
import { requireSuperadmin } from '@/core/services/superadmin/guard';
import { logSuperadminEvent } from '@/core/services/superadmin/audit';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { validateUserAccountAction } from '@/core/services/superadmin/user-account-actions';
import { verifySuperadminPassword } from '@/core/services/superadmin/verify-superadmin-password';
import { deleteUserAccount } from '@/core/services/users/delete-user-account';

const SUSPEND_FOREVER = '876000h';

async function countSuperadmins(adminClient) {
  const { count, error } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_superadmin', true);

  if (error) {
    throw new Error('Failed to validate superadmin count.');
  }

  return count || 0;
}

async function getTargetUser(adminClient, targetUserId) {
  const { data, error } = await adminClient
    .from('users')
    .select('id, email, is_superadmin, account_status, suspended_at, suspension_reason')
    .eq('id', targetUserId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Target user not found.');
  }

  return data;
}

export async function PATCH(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { id: targetUserId } = await params;
    const { adminClient, user: actor } = guard;
    const body = await request.json();
    const action = body?.action;
    const password = body?.password;
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

    const passwordCheck = await verifySuperadminPassword(actor.email, password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 403 });
    }

    const targetUser = await getTargetUser(adminClient, targetUserId);
    const { data: authRow } = await adminClient.auth.admin.getUserById(targetUserId);
    const existingUserMetadata = authRow?.user?.user_metadata || {};
    const existingAppMetadata = authRow?.user?.app_metadata || {};
    const superadminCount = targetUser.is_superadmin ? await countSuperadmins(adminClient) : null;

    const validation = validateUserAccountAction({
      action,
      actorUserId: actor.id,
      targetUserId,
      targetIsSuperadmin: targetUser.is_superadmin,
      currentSuperadminCount: superadminCount,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    if (action === 'suspend') {
      if (!reason) {
        return NextResponse.json({ error: 'Suspension reason is required.' }, { status: 400 });
      }
      if (targetUser.account_status === 'suspended') {
        return NextResponse.json({ error: 'User is already suspended.' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          account_status: 'suspended',
          suspended_at: now,
          suspended_by_user_id: actor.id,
          suspension_reason: reason,
        })
        .eq('id', targetUserId);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to suspend user.');
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: SUSPEND_FOREVER,
        user_metadata: {
          ...existingUserMetadata,
          account_status: 'suspended',
          suspension_reason: reason,
        },
        app_metadata: {
          ...existingAppMetadata,
          account_status: 'suspended',
        },
      });

      if (authError) {
        await adminClient
          .from('users')
          .update({
            account_status: targetUser.account_status || 'active',
            suspended_at: null,
            suspended_by_user_id: null,
            suspension_reason: null,
          })
          .eq('id', targetUserId);
        throw new Error(authError.message || 'Failed to suspend auth account.');
      }

      await logSuperadminEvent(adminClient, {
        requestId: request.headers.get('x-request-id') || null,
        userId: actor.id,
        action: 'suspend_user',
        status: 'success',
        message: `Suspended user ${targetUserId}`,
        metadata: { target_user_id: targetUserId, reason },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: targetUserId,
          account_status: 'suspended',
          suspended_at: now,
          suspension_reason: reason,
        },
      });
    }

    if (action === 'unsuspend') {
      if (targetUser.account_status !== 'suspended') {
        return NextResponse.json({ error: 'User is not suspended.' }, { status: 400 });
      }

      const { error: updateError } = await adminClient
        .from('users')
        .update({
          account_status: 'active',
          suspended_at: null,
          suspended_by_user_id: null,
          suspension_reason: null,
        })
        .eq('id', targetUserId);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to unsuspend user.');
      }

      const { error: authError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: 'none',
        user_metadata: {
          ...existingUserMetadata,
          account_status: 'active',
          suspension_reason: null,
        },
        app_metadata: {
          ...existingAppMetadata,
          account_status: 'active',
        },
      });

      if (authError) {
        await adminClient
          .from('users')
          .update({
            account_status: 'suspended',
            suspended_at: targetUser.suspended_at || new Date().toISOString(),
            suspended_by_user_id: actor.id,
            suspension_reason: targetUser.suspension_reason || reason || 'Suspension restored after unsuspend failure',
          })
          .eq('id', targetUserId);
        throw new Error(authError.message || 'Failed to restore auth access.');
      }

      await logSuperadminEvent(adminClient, {
        requestId: request.headers.get('x-request-id') || null,
        userId: actor.id,
        action: 'unsuspend_user',
        status: 'success',
        message: `Unsuspended user ${targetUserId}`,
        metadata: { target_user_id: targetUserId },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: targetUserId,
          account_status: 'active',
          suspended_at: null,
          suspension_reason: null,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid account action.' }, { status: 400 });
  } catch (error) {
    console.error('[Superadmin User Account PATCH] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user account.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const guard = await requireSuperadmin();
    if (guard.errorResponse) return guard.errorResponse;

    const { id: targetUserId } = await params;
    const { adminClient, user: actor } = guard;
    const body = await request.json().catch(() => ({}));
    const password = body?.password;

    const passwordCheck = await verifySuperadminPassword(actor.email, password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 403 });
    }

    const targetUser = await getTargetUser(adminClient, targetUserId);
    const superadminCount = targetUser.is_superadmin ? await countSuperadmins(adminClient) : null;

    const validation = validateUserAccountAction({
      action: 'delete',
      actorUserId: actor.id,
      targetUserId,
      targetIsSuperadmin: targetUser.is_superadmin,
      currentSuperadminCount: superadminCount,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { data: authRow } = await adminClient.auth.admin.getUserById(targetUserId);
    await deleteUserAccount(adminClient, targetUserId, authRow?.user || targetUser);

    await logSuperadminEvent(adminClient, {
      requestId: request.headers.get('x-request-id') || null,
      userId: actor.id,
      action: 'delete_user',
      status: 'success',
      message: `Deleted user ${targetUserId}`,
      metadata: { target_user_id: targetUserId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Superadmin User Account DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
