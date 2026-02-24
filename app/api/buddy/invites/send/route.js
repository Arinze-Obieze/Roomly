
import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendBuddyInvite } from '@/core/utils/email';
import { validateCSRFRequest } from '@/core/utils/csrf';
import crypto from 'crypto';

// Rate limit tracking for buddy invites (in-memory for dev; use Redis for prod)
const inviteAttempts = new Map();

const checkInviteRateLimit = (userId, email) => {
  const key = `${userId}:${email}`;
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX_INVITES = 5; // Max 5 invites per email per hour per user

  if (!inviteAttempts.has(key)) {
    inviteAttempts.set(key, []);
  }

  const attempts = inviteAttempts.get(key);
  const recentAttempts = attempts.filter(time => now - time < WINDOW);
  inviteAttempts.set(key, recentAttempts);

  if (recentAttempts.length >= MAX_INVITES) {
    return false;
  }

  recentAttempts.push(now);
  return true;
};

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

    const { email, groupId } = await request.json();

    if (!email || !groupId) {
      return NextResponse.json({ error: 'Email and Group ID are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Rate limiting
    if (!checkInviteRateLimit(user.id, email)) {
      return NextResponse.json(
        { error: 'Too many invite attempts for this email. Please try again later.' },
        { status: 429 }
      );
    }

    // 1. Verify user is admin of the group
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

    // 2. Check if user is already a member
    const { data: existingMember } = await supabase
      .from('buddy_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!existingMember) {
      return NextResponse.json({ error: 'You must be a member of the group to invite others' }, { status: 403 });
    }

    // 3. Check if invite already exists and is still pending
    const { data: pendingInvite } = await supabase
      .from('buddy_invites')
      .select('id, expires_at')
      .eq('email', email.toLowerCase())
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pendingInvite) {
      return NextResponse.json({ 
        error: 'An active invite for this email already exists',
        message: 'If the user did not receive the email, you can resend it.'
      }, { status: 400 });
    }

    // 4. Generate Token and Expiry (48 hours)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 5. Create Invite Record
    const { error: inviteError } = await supabase
      .from('buddy_invites')
      .insert({
        group_id: groupId,
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt,
        status: 'pending'
      });

    if (inviteError) throw inviteError;

    // 6. Send Email
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
    const inviteLink = `${baseUrl}/dashboard/buddy/join?token=${token}`;

    // Get inviter name
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

    return NextResponse.json({ 
        success: true, 
        emailSent: emailResult.success,
        message: 'Invite sent successfully' 
    });

  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
