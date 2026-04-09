import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { logActivityEvent } from '@/core/services/observability/activity-log';

export async function DELETE(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: group, error: groupError } = await adminSupabase
      .from('buddy_groups')
      .select('id, admin_id')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.admin_id !== user.id) {
      return NextResponse.json({ error: 'Only the group admin can delete this group' }, { status: 403 });
    }

    const { error: deleteError } = await adminSupabase
      .from('buddy_groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      throw deleteError;
    }

    await logActivityEvent({
      adminClient: adminSupabase,
      request,
      userId: user.id,
      service: 'buddy',
      action: 'delete_buddy_group',
      status: 'success',
      message: `Deleted buddy group ${groupId}`,
      metadata: {
        group_id: groupId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Buddy Group DELETE] Error:', error);
    await logActivityEvent({
      request,
      service: 'buddy',
      action: 'delete_buddy_group',
      status: 'failed',
      level: 'error',
      message: `Failed to delete buddy group: ${error.message || error}`,
      metadata: {},
    });
    return NextResponse.json({ error: error.message || 'Failed to delete group' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const { id: groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rawName = body?.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    if (name.length < 3 || name.length > 60) {
      return NextResponse.json(
        { error: 'Group name must be between 3 and 60 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: group, error: groupError } = await adminSupabase
      .from('buddy_groups')
      .select('id, admin_id')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.admin_id !== user.id) {
      return NextResponse.json({ error: 'Only the group admin can update settings' }, { status: 403 });
    }

    const { data: updatedGroup, error: updateError } = await adminSupabase
      .from('buddy_groups')
      .update({ name })
      .eq('id', groupId)
      .select('id, name')
      .single();

    if (updateError) {
      throw updateError;
    }

    await logActivityEvent({
      adminClient: adminSupabase,
      request,
      userId: user.id,
      service: 'buddy',
      action: 'update_buddy_group',
      status: 'success',
      message: `Updated buddy group ${groupId}`,
      metadata: {
        group_id: groupId,
        group_name: updatedGroup.name,
      },
    });

    return NextResponse.json({ success: true, group: updatedGroup });
  } catch (error) {
    console.error('[Buddy Group PATCH] Error:', error);
    await logActivityEvent({
      request,
      service: 'buddy',
      action: 'update_buddy_group',
      status: 'failed',
      level: 'error',
      message: `Failed to update buddy group: ${error.message || error}`,
      metadata: {},
    });
    return NextResponse.json({ error: error.message || 'Failed to update group settings' }, { status: 500 });
  }
}
