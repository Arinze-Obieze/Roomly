import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        users (
          id,
          full_name,
          profile_picture
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(comments);

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content
      })
      .select(`
        *,
        users (
          id,
          full_name,
          profile_picture
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
