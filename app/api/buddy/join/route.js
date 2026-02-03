
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 1. Find Invite
    const { data: invite, error: inviteError } = await supabase
      .from('buddy_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
        return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    // 2. Check if already member
    const { data: existingMember } = await supabase
        .from('buddy_group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .single();

    if (existingMember) {
        return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
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

    if (joinError) throw joinError;

    // 4. Update Invite Status
    await supabase
        .from('buddy_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

    return NextResponse.json({ success: true, groupId: invite.group_id });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
