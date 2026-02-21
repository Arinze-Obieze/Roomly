
import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { sanitizeText, sanitizeLength } from '@/core/utils/sanitizers';
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';
import crypto from 'crypto';

// Generate cache key from group ID
const generateCacheKey = (groupId) => {
  const hash = crypto
    .createHash('md5')
    .update(groupId)
    .digest('hex');
  return `buddy:messages:${hash}`;
};

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const cacheKey = generateCacheKey(groupId);

    // Try to fetch from cache first (30 seconds for frequently updated messages)
    const cachedData = await cachedFetch(cacheKey, 30, async () => {
      return await fetchMessagesFromDB(supabase, user.id, groupId);
    });

    return NextResponse.json({ data: cachedData });

  } catch (error) {
    console.error('[Buddy Messages GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Extract database fetch logic
async function fetchMessagesFromDB(supabase, userId, groupId) {
  // 1. Verify Membership
  const { data: member } = await supabase
      .from('buddy_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

  if (!member) {
      throw new Error('Not a member of this group');
  }

  // 2. Fetch Messages
  const { data: messages, error } = await supabase
      .from('buddy_messages')
      .select(`
          id, 
          sender_id,
          content, 
          attachment_type, 
          attachment_data, 
          created_at,
          sender:sender_id(full_name, profile_picture)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

  if (error) throw error;

  return messages;
}



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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId, content, attachmentType, attachmentData } = await request.json();

    if (!groupId || (!content && !attachmentData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Validate group ID format
    if (typeof groupId !== 'string' || groupId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Validate and sanitize content
    if (content) {
      if (typeof content !== 'string' || content.length === 0 || content.length > 5000) {
        return NextResponse.json({ error: 'Message must be between 1 and 5000 characters' }, { status: 400 });
      }
    }

    // 1. Verify Group Exists
    const { data: group, error: groupError } = await supabase
        .from('buddy_groups')
        .select('id')
        .eq('id', groupId)
        .single();

    if (groupError || !group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 2. Verify Active Membership
    const { data: member } = await supabase
        .from('buddy_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    if (!member) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // 3. Sanitize content
    let sanitizedContent = content ? sanitizeText(sanitizeLength(content, 5000)) : null;

    // 4. Insert Message
    const { data: message, error } = await supabase
        .from('buddy_messages')
        .insert({
            group_id: groupId,
            sender_id: user.id,
            content: sanitizedContent,
            attachment_type: attachmentType && ['image', 'video', 'file'].includes(attachmentType) ? attachmentType : 'text',
            attachment_data: attachmentData || null
        })
        .select()
        .single();

    if (error) throw error;

    // Invalidate messages cache for this group when new message is added
    const cacheKey = generateCacheKey(groupId);
    await invalidatePattern(cacheKey);

    return NextResponse.json({ success: true, data: message });

  } catch (error) {
    console.error('[Buddy Messages POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
