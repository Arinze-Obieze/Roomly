/**
 * EXAMPLE: How to integrate Redis caching into API endpoints
 * 
 * This shows the pattern to apply to all GET endpoints:
 * 1. Generate a cache key from query params
 * 2. Try Redis cache first
 * 3. Query database if cache miss
 * 4. Store in Redis with appropriate TTL
 * 5. Invalidate cache on mutations
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { cachedFetch, setCached, invalidatePattern } from '@/core/utils/redis';

// Generate cache key from query parameters
const generateCacheKey = (searchParams) => {
  const params = new URLSearchParams(searchParams);
  // Sort to ensure consistent key for same filters
  const sorted = Array.from(params.entries()).sort();
  return `properties:list:${JSON.stringify(sorted)}`;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(searchParams);

    // Try Redis first (5 min TTL for listings)
    const data = await cachedFetch(cacheKey, 300, async () => {
      const supabase = await createClient();
      
      // ... existing query logic ...
      // (see original properties/route.js for full implementation)
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '12');
      
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, count, error } = await query;
      
      if (error) throw error;

      return { data, count };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ... existing mutation logic ...
    const body = await request.json();
    const { data, error } = await supabase
      .from('properties')
      .insert({...body, listed_by_user_id: user.id})
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache patterns after creating property
    await invalidatePattern('properties:list:*');
    await invalidatePattern(`properties:user:${user.id}:*`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ... existing update logic ...

    // Invalidate specific property cache AND listing cache
    await invalidatePattern('properties:list:*');
    await invalidatePattern(`properties:${id}:*`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}
