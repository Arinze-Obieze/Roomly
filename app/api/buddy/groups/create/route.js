
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, preferences } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
      .from('buddy_groups')
      .insert({
        name,
        admin_id: user.id,
        preferences: preferences || {}
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // 2. Add Creator as Member (Admin)
    const { error: memberError } = await supabase
      .from('buddy_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
        status: 'active'
      });

    if (memberError) {
      // Cleanup group if member creation fails
      await supabase.from('buddy_groups').delete().eq('id', group.id);
      throw memberError;
    }

    return NextResponse.json({ success: true, data: group });

  } catch (error) {
    console.error('Error creating buddy group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
