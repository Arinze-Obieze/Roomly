import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';

export async function DELETE(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: groupId, userId: targetUserId } = await params;
    if (!groupId || !targetUserId) {
      return NextResponse.json({ error: 'Group ID and member ID are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const [{ data: requester }, { data: target }, { data: group }] = await Promise.all([
      adminSupabase
        .from('buddy_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle(),
      adminSupabase
        .from('buddy_group_members')
        .select('role, status')
        .eq('group_id', groupId)
        .eq('user_id', targetUserId)
        .maybeSingle(),
      adminSupabase
        .from('buddy_groups')
        .select('id, admin_id')
        .eq('id', groupId)
        .maybeSingle(),
    ]);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!requester || requester.status !== 'active') {
      return NextResponse.json({ error: 'You are not an active member of this group' }, { status: 403 });
    }

    if (!target || target.status !== 'active') {
      return NextResponse.json({ error: 'Member not found or already removed' }, { status: 404 });
    }

    const isSelf = targetUserId === user.id;
    const isAdmin = group.admin_id === user.id;

    if (isSelf) {
      if (isAdmin) {
        return NextResponse.json(
          { error: 'Group admins cannot leave. Delete the group instead.' },
          { status: 400 }
        );
      }
    } else {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
      }
      if (target.role === 'admin') {
        return NextResponse.json({ error: 'Cannot remove another admin from the group' }, { status: 400 });
      }
    }

    const { error: updateError } = await adminSupabase
      .from('buddy_group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      action: isSelf ? 'left' : 'removed',
      memberId: targetUserId,
    });
  } catch (error) {
    console.error('[Buddy Group Member DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update membership' }, { status: 500 });
  }
}
