import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { Notifier } from '@/core/services/notifications/notifier';

export async function POST(request) {
  try {
    // Validate CSRF token
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Find Invite without strict filtering to provide accurate error messages
    const { data: invite, error: inviteError } = await adminSupabase
      .from('buddy_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
        return NextResponse.json({ error: 'Invite not found. Make sure the link is correct.' }, { status: 404 });
    }

    // 2. Validate email match
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
        return NextResponse.json({ error: `This invite was sent to ${invite.email}. Please login with that account to join.` }, { status: 403 });
    }

    // 3. Check expiration
    if (invite.status === 'expired' || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
        return NextResponse.json({ error: 'This invite has expired.' }, { status: 400 });
    }

    // 4. Check if already member
    const { data: existingMember } = await adminSupabase
        .from('buddy_group_members')
        .select('id, status')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existingMember) {
        if (existingMember.status === 'active') {
            return NextResponse.json({ 
                success: true, 
                groupId: invite.group_id,
                alreadyMember: true,
                message: 'You are already a member of this group' 
            });
        }

        // If they left, reactivate them
        const { error: reactivateError } = await adminSupabase
            .from('buddy_group_members')
            .update({
              status: 'active',
              role: 'member',
              joined_at: new Date().toISOString(),
            })
            .eq('id', existingMember.id);

        if (reactivateError) {
          throw reactivateError;
        }
    } else {
        // Only allow join if not already accepted by someone else
        // (Though we verify email now, it's a good safety check)
        if (invite.status === 'accepted') {
            return NextResponse.json({ error: 'This invite has already been used.' }, { status: 400 });
        }

        // Add to Group
        const { error: joinError } = await adminSupabase
            .from('buddy_group_members')
            .insert({
                group_id: invite.group_id,
                user_id: user.id,
                role: 'member',
                status: 'active'
            });

        if (joinError) {
            console.error('Join group error:', joinError);
            throw joinError;
        }
    }

    // 5. Update Invite Status to accepted if it wasn't already
    if (invite.status !== 'accepted') {
        const { error: updateError } = await adminSupabase
            .from('buddy_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        if (updateError) {
            console.error('Update invite error:', updateError);
        }
    }

    // 6. Notify Group Admin
    try {
      const { data: group } = await adminSupabase
        .from('buddy_groups')
        .select('name, admin_id')
        .eq('id', invite.group_id)
        .single();
      
      if (group && group.admin_id !== user.id) {
        await Notifier.send({
          userId: group.admin_id,
          type: 'system',
          title: 'New Group Member',
          message: `${user.full_name || 'Someone'} joined your group "${group.name}"`,
          link: `/dashboard/buddy?groupId=${invite.group_id}`,
          data: { groupId: invite.group_id },
          channels: ['in-app', 'push'] // Join is likely expected, so maybe skip email to avoid spam
        });
      }
    } catch (nError) {
      console.error('[Buddy Join Notification Error]:', nError);
    }

    return NextResponse.json({ 
        success: true, 
        groupId: invite.group_id,
        alreadyMember: false
    });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
