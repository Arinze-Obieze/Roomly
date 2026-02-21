import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';
import crypto from 'crypto';

// Generate cache key for community post details (includes user for personalized data)
const generateCacheKey = (postId, userId = 'anon') => {
  const hash = crypto
    .createHash('md5')
    .update(`${postId}:${userId}`)
    .digest('hex');
  return `community:post:${hash}`;
};

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';
    
    const cacheKey = generateCacheKey(id, userId);

    // Try to fetch from cache first (5 min TTL for community post details)
    const cachedData = await cachedFetch(cacheKey, 300, async () => {
      return await fetchPostFromDB(supabase, id, user);
    });

    return NextResponse.json(cachedData);

  } catch (error) {
    console.error('[Community Post GET] Error:', error);
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
}

// Extract database fetch logic
async function fetchPostFromDB(supabase, id, user) {
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
  const score = post.community_votes.reduce((acc, curr) => acc + curr.vote_type, 0);
  const userVote = user 
    ? post.community_votes.find(v => v.user_id === user.id)?.vote_type || 0
    : 0;

  const { community_votes, ...postData } = post;

  return {
    ...postData,
    score,
    user_vote: userVote,
    author: post.users,
  };
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

    // Invalidate community post caches when post is deleted
    await invalidatePattern('community:post:*');
    await invalidatePattern('community:posts:*');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Community Post DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
