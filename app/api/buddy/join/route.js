
import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Find Invite - with explicit NULL check for expires_at
    const { data: invite, error: inviteError } = await supabase
      .from('buddy_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .not('expires_at', 'is', null) // Explicit NULL check
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
        return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    // 2. Check if already member - idempotent response
    const { data: existingMember } = await supabase
        .from('buddy_group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

    if (existingMember) {
        // Instead of error, return success (idempotent)
        // This prevents double-submission issues
        return NextResponse.json({ 
            success: true, 
            groupId: invite.group_id,
            alreadyMember: true,
            message: 'You are already a member of this group' 
        });
    }

    // 3. Add to Group
    const { error: joinError } = await supabase
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

    // 4. Update Invite Status (mark as accepted)
    const { error: updateError } = await supabase
        .from('buddy_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

    if (updateError) {
        console.error('Update invite error:', updateError);
        // Continue anyway - user was added to group
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
