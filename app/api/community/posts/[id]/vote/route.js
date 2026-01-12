import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vote_type } = await request.json(); // 1 (up), -1 (down), 0 (remove)

    if (vote_type === 0) {
      // Remove vote
      const { error } = await supabase
        .from('community_votes')
        .delete()
        .match({ post_id: id, user_id: user.id });
        
      if (error) throw error;
    } else {
      // Upsert vote
      const { error } = await supabase
        .from('community_votes')
        .upsert({
          post_id: id,
          user_id: user.id,
          vote_type: vote_type
        }, {
          onConflict: 'post_id,user_id'
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
