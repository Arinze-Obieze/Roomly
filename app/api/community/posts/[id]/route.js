import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        users (
          id,
          full_name,
          profile_picture
        ),
        community_votes (
          vote_type,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Enhance payload
    const { data: { user } } = await supabase.auth.getUser();
    
    const score = post.community_votes.reduce((acc, curr) => acc + curr.vote_type, 0);
    const userVote = user 
      ? post.community_votes.find(v => v.user_id === user.id)?.vote_type || 0
      : 0;

    const { community_votes, ...postData } = post;

    return NextResponse.json({
      ...postData,
      score,
      user_vote: userVote,
      author: post.users,
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS policies should handle ownership check, but explicit check is good for custom error
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', id); // RLS ensures: AND user_id = auth.uid()

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
