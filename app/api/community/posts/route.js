import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sanitizeText, sanitizeLength, sanitizeUrl } from '@/core/utils/sanitizers';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';
import crypto from 'crypto';

// Generate cache key from query parameters
const generateCacheKey = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `community:posts:${hash}`;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Generate cache key
    const cacheKey = generateCacheKey(searchParams);
    
    // Try to fetch from cache first (2 min TTL for community posts)
    const cachedData = await cachedFetch(cacheKey, 120, async () => {
      return await fetchPostsFromDB(searchParams);
    });

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('[Community Posts GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// Extract database fetch logic
async function fetchPostsFromDB(searchParams) {
  const supabase = await createClient();
    
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '10');
  const cursor = searchParams.get('cursor');

  const validLimit = Math.min(Math.max(limit, 1), 50);

  let query = supabase
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
      ),
      community_comments (count)
    `)
    .order('created_at', { ascending: false });

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data: posts, error } = await query.range(0, validLimit);

  if (error) throw error;

  const { data: { user } } = await supabase.auth.getUser();
    
  const formattedPosts = posts.map(post => {
    const userVote = user 
      ? post.community_votes.find(v => v.user_id === user.id)?.vote_type || 0
      : 0;

    const score = post.community_votes.reduce((acc, curr) => acc + curr.vote_type, 0);

    const { community_votes, community_comments, ...postData } = post;
      
    return {
      ...postData,
      score,
      user_vote: userVote,
      author: post.users,
      comments_count: community_comments?.[0]?.count || 0
    };
  });

  const hasMore = formattedPosts.length >= validLimit;
  const nextCursor = hasMore && formattedPosts.length > 0 
    ? formattedPosts[formattedPosts.length - 1].created_at
      : null;

  return {
    posts: formattedPosts.slice(0, validLimit),
    hasMore,
    nextCursor,
  };
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { title, content, city, category, image_url, is_anonymous, csrfToken } = body;

    if (!title || !content || !city || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Input validation - check lengths
    if (typeof title !== 'string' || title.length === 0 || title.length > 200) {
      return NextResponse.json({ error: 'Title must be between 1 and 200 characters' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.length === 0 || content.length > 5000) {
      return NextResponse.json({ error: 'Content must be between 1 and 5000 characters' }, { status: 400 });
    }

    if (typeof city !== 'string' || city.length === 0 || city.length > 100) {
      return NextResponse.json({ error: 'City must be between 1 and 100 characters' }, { status: 400 });
    }

    const validCategories = ['general', 'scam_alert', 'tip', 'event', 'news'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Sanitize inputs to prevent XSS
    title = sanitizeText(sanitizeLength(title, 200));
    content = sanitizeText(sanitizeLength(content, 5000));
    city = sanitizeText(sanitizeLength(city, 100));
    
    // Sanitize image URL if provided
    if (image_url) {
      image_url = sanitizeUrl(image_url);
      if (!image_url) {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        title,
        content,
        city,
        category,
        image_url: image_url || null,
        is_anonymous: is_anonymous === true
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate community posts cache when new post is created
    await invalidatePattern('community:posts:*');

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Community Posts POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
