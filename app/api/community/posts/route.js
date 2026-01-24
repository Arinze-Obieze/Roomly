import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: posts, error, count } = await query;

    if (error) throw error;

    // Transform data to include user-specific fields if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    const formattedPosts = posts.map(post => {
      // Calculate effective vote count if not triggered (optional, can relay on DB counter)
      // Here we trust the DB counter 'upvotes_count' but simpler is usually better.
      // Let's use the raw data.
      
      const userVote = user 
        ? post.community_votes.find(v => v.user_id === user.id)?.vote_type || 0
        : 0;

      // Calculate total score from votes relation if manual calculation needed, 
      // but for simplicity/performance we rely on upvotes_count column if managed,
      // OR calculate it here:
      const score = post.community_votes.reduce((acc, curr) => acc + curr.vote_type, 0);

      const { community_votes, community_comments, ...postData } = post; // remove raw votes/comments array from response for lean payload
      
      return {
        ...postData,
        score, // Use calculated score from actual votes for accuracy
        user_vote: userVote,
        author: post.users,
        comments_count: community_comments?.[0]?.count || 0
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      hasMore: posts.length === limit,
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, city, category, image_url } = body; // image_url optional

    if (!title || !content || !city || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        title,
        content,
        city,
        category,
        image_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
