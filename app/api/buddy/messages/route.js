
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // 1. Verify Membership
    const { data: member } = await supabase
        .from('buddy_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

    if (!member) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
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

    return NextResponse.json({ data: messages });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId, content, attachmentType, attachmentData } = await request.json();

    if (!groupId || (!content && !attachmentData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Verify Membership
    const { data: member } = await supabase
        .from('buddy_group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .status('active') // Ensure active
        .single();

    if (!member) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // 2. Insert Message
    const { data: message, error } = await supabase
        .from('buddy_messages')
        .insert({
            group_id: groupId,
            sender_id: user.id,
            content,
            attachment_type: attachmentType || 'text',
            attachment_data: attachmentData
        })
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: message });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
