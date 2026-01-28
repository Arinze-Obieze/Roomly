
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendBuddyInvite } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, groupId } = await request.json();

    if (!email || !groupId) {
      return NextResponse.json({ error: 'Email and Group ID are required' }, { status: 400 });
    }

    // 1. Verify user is admin of the group (or just a member if we relax rules later)
    // For now, let's strictly follow the DB policy: Admin only
    const { data: group, error: groupError } = await supabase
      .from('buddy_groups')
      .select('name, admin_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.admin_id !== user.id) {
        return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
    }

    // 2. Generate Token and Expiry (48 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 3. Create Invite Record
    const { error: inviteError } = await supabase
      .from('buddy_invites')
      .insert({
        group_id: groupId,
        email,
        token,
        expires_at: expiresAt,
        status: 'pending'
      });

    if (inviteError) throw inviteError;

    // 4. Send Email
    // Construct Invite Link - assume localhost or domain from request/env
    // We'll use a relative path for now, client/email lib handles domain if passed, 
    // but here we construct the full URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/dashboard/buddy/join?token=${token}`;

    // Get inviter name (optional)
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();
    
    const inviterName = profile?.full_name || 'A friend';

    const emailResult = await sendBuddyInvite({
        to: email,
        inviteLink,
        inviterName,
        groupName: group.name
    });

    return NextResponse.json({ success: true, emailSent: emailResult.success });

  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
