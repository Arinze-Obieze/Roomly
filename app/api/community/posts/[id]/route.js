import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { bumpCacheVersion, cachedFetch, getCachedInt } from '@/core/utils/redis';
import crypto from 'crypto';
import { validateCSRFRequest } from '@/core/utils/csrf';

// Generate cache key for community post details (includes user for personalized data)
const generateCacheKey = (postId, userId = 'anon', version = 1) => {
  const hash = crypto
    .createHash('md5')
    .update(`${postId}:${userId}:${version}`)
    .digest('hex');
  return `community:post:${hash}`;
};

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';
    const version = await getCachedInt(`v:community:post:${id}`, 1);
    
    const cacheKey = generateCacheKey(id, userId, version);

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
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

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

    await Promise.all([
      bumpCacheVersion('v:community:posts'),
      bumpCacheVersion(`v:community:post:${id}`),
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Community Post DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
