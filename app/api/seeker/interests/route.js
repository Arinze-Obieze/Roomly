import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cachedFetch } from '@/core/utils/redis';
import crypto from 'crypto';

// Generate cache key for user interests
const generateCacheKey = (userId) => {
  const hash = crypto
    .createHash('md5')
    .update(userId)
    .digest('hex');
  return `seeker:interests:${hash}`;
};

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = generateCacheKey(user.id);

    // Try to fetch from cache first (10 min TTL for seeker interests)
    const cachedData = await cachedFetch(cacheKey, 600, async () => {
      return await fetchSeekerInterestsFromDB(supabase, user.id);
    });

    return NextResponse.json({ data: cachedData });

  } catch (error) {
    console.error('[Seeker Interests GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchSeekerInterestsFromDB(supabase, userId) {
  // 1. Get interests created by this seeker
  const { data: interests, error } = await supabase
    .from('property_interests')
    .select(`
      *,
      properties (
        *,
        property_media (
          url,
          is_primary,
          display_order
        ),
        users!listed_by_user_id (
          full_name,
          profile_picture,
          is_verified
        )
      )
    `)
    .eq('seeker_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 2. Transform data for seeker view
  const transformed = interests.map(item => {
    const property = item.properties;
    const isAccepted = item.status === 'accepted';
    const isPrivate = property.privacy_setting === 'private';
    const shouldMask = isPrivate && !isAccepted;

    let propertyData = { ...property };

    if (shouldMask) {
      // Mask Property Details for Seeker
      propertyData.title = `Room in ${property.city}`;
      propertyData.street = undefined;
      propertyData.price_range = `€${Math.floor(property.price_per_month / 100) * 100}-${Math.ceil(property.price_per_month / 100) * 100}`;
      propertyData.price_per_month = undefined;
      propertyData.description = property.description?.substring(0, 100) + '...';
      propertyData.isBlurry = true;

      if (propertyData.users) {
          const nameParts = propertyData.users.full_name?.split(' ') || [];
          propertyData.users.full_name = nameParts.length > 1 
              ? `${nameParts[0]} ${nameParts[1][0]}.` 
              : propertyData.users.full_name;
      }
    }

    return {
      id: item.id,
      status: item.status,
      createdAt: item.created_at,
      property: propertyData,
      isPrivateProperty: isPrivate,
      shouldMask
    };
  });

  return transformed;
}
