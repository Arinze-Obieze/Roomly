import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { cachedFetch } from '@/core/utils/redis';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

// Generate consistent cache key from query parameters
const generateCacheKey = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  // Create hash of params for consistent key
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `properties:list:${hash}`;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Generate cache key
    const cacheKey = generateCacheKey(searchParams);
    
    // Try to fetch from cache first (5 min TTL for listings)
    const cachedData = await cachedFetch(cacheKey, 300, async () => {
      return await fetchPropertiesFromDB(searchParams);
    });

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('[Properties GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchPropertiesFromDB(searchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');
  const priceRange = searchParams.get('priceRange');
  const minPrice = parseInt(searchParams.get('minPrice') || '');
  const maxPrice = parseInt(searchParams.get('maxPrice') || '');
  const bedrooms = searchParams.get('bedrooms')?.split(',').map(Number).filter(Boolean);
  const propertyType = searchParams.get('propertyType');
  const propertyTypes = searchParams.get('propertyTypes')?.split(',').map(v => v.trim()).filter(Boolean);
  const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
  const minBedrooms = parseInt(searchParams.get('minBedrooms'));
  const minBathrooms = parseInt(searchParams.get('minBathrooms'));
  const location = searchParams.get('location');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy');

  const supabase = await createClient();

  let query = supabase
    .from('properties')
    .select(`
      *,
      property_media (
        id,
        url,
        media_type,
        display_order,
        is_primary
      ),
      users!listed_by_user_id (
        id,
        full_name,
        profile_picture
      )
    `, { count: 'exact' })
    .eq('is_active', true);

  if (!Number.isNaN(minPrice)) {
    query = query.gte('price_per_month', minPrice);
  }

  if (!Number.isNaN(maxPrice)) {
    query = query.lte('price_per_month', maxPrice);
  }

  if (priceRange && priceRange !== 'all') {
    const priceRanges = {
      budget: { min: 0, max: 800 },
      mid: { min: 800, max: 1500 },
      premium: { min: 1500, max: 999999 }
    };
    const range = priceRanges[priceRange];
    if (range) {
      query = query.gte('price_per_month', range.min).lte('price_per_month', range.max);
    }
  }

  if (bedrooms && bedrooms.length > 0) {
    query = query.in('bedrooms', bedrooms);
  }
  
  if (minBedrooms) {
    query = query.gte('bedrooms', minBedrooms);
  }
  
  if (minBathrooms) {
    query = query.gte('bathrooms', minBathrooms);
  }

  if (propertyTypes && propertyTypes.length > 0) {
    query = query.in('property_type', propertyTypes);
  } else if (propertyType && propertyType !== 'any') {
    query = query.eq('property_type', propertyType);
  }

  if (location) {
    query = query.or(`city.ilike.*${location}*,state.ilike.*${location}*,street.ilike.*${location}*`);
  }

  if (search) {
    query = query.or(`title.ilike.*${search}*,description.ilike.*${search}*,city.ilike.*${search}*,state.ilike.*${search}*,street.ilike.*${search}*`);
  }

  if (amenities && amenities.length > 0) {
    query = query.contains('amenities', amenities);
  }

  switch (sortBy) {
    case 'price_low':
      query = query.order('price_per_month', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'price_high':
      query = query.order('price_per_month', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'new':
    case 'recommended':
    case 'match':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const queryStart = Date.now();
  const { data, error, count } = await query;
  console.log(`[PERF_DEBUG] DB Query Time: ${Date.now() - queryStart}ms`);

  if (error) {
    console.error('[DB] Error:', error);
    throw error;
  }

  const authStart = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  console.log(`[PERF_DEBUG] Auth getUser Time: ${Date.now() - authStart}ms`);

  // Fetch interests for the current user
  let interests = [];
  if (user) {
    const interestStart = Date.now();
    const { data: interestData } = await supabase
      .from('property_interests')
      .select('property_id, status')
      .eq('seeker_id', user.id);
    interests = interestData || [];
    console.log(`[PERF_DEBUG] Interests Fetch Time: ${Date.now() - interestStart}ms`);
  }

  const transformedData = data.map(property => {
    const interest = interests.find(i => i.property_id === property.id);
    const isMutualInterest = interest?.status === 'accepted';
    const isPrivate = property.privacy_setting === 'private';
    const shouldMask = isPrivate && !isMutualInterest;

    let hostName = property.users?.full_name || 'Unknown';
    
    if (!user && hostName !== 'Unknown') {
      hostName = hostName.split(' ')[0];
    }

    if (shouldMask) {
      const nameParts = hostName.split(' ');
      const maskedName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[1][0]}.` 
        : hostName;

      return {
        id: property.id,
        title: `Room in ${property.city}`,
        location: `${property.city}, ${property.state}`,
        price: property.price_per_month,
        priceRange: `€${Math.floor(property.price_per_month / 100) * 100}-${Math.ceil(property.price_per_month / 100) * 100}`,
        period: 'month',
        image: (() => {
          const primary = property.property_media?.find(m => m.is_primary);
          if (primary?.url) {
            return primary.url.startsWith('http') 
              ? primary.url 
              : supabase.storage.from('property-media').getPublicUrl(primary.url).data.publicUrl;
          }
          const first = property.property_media?.[0];
          if (first?.url) {
            return first.url.startsWith('http')
              ? first.url
              : supabase.storage.from('property-media').getPublicUrl(first.url).data.publicUrl;
          }
          return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
        })(),
        isBlurry: true,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        propertyType: property.property_type,
        amenities: (property.amenities || []).slice(0, 3).map(a => ({ icon: 'FaWifi', label: a })),
        verified: false,
        isPrivate: true,
        interestStatus: interest?.status || null,
        host: {
          name: maskedName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(maskedName)}&background=random`,
          id: property.listed_by_user_id
        },
        description: property.description?.substring(0, 100) + '...',
        availableFrom: property.available_from,
        createdAt: property.created_at
      };
    }

    return {
      id: property.id,
      title: property.title,
      location: `${property.city}, ${property.state}`,
      price: property.price_per_month,
      period: 'month',
      image: (() => {
        const primary = property.property_media?.find(m => m.is_primary);
        if (primary?.url) {
          return primary.url.startsWith('http') 
            ? primary.url 
            : supabase.storage.from('property-media').getPublicUrl(primary.url).data.publicUrl;
        }
        const first = property.property_media?.[0];
        if (first?.url) {
          return first.url.startsWith('http')
            ? first.url
            : supabase.storage.from('property-media').getPublicUrl(first.url).data.publicUrl;
        }
        return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
      })(),
      images: property.property_media?.sort((a, b) => a.display_order - b.display_order).map(m => 
        m.url.startsWith('http') 
          ? m.url 
          : supabase.storage.from('property-media').getPublicUrl(m.url).data.publicUrl
      ) || [],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.property_type,
      amenities: (property.amenities || []).map(a => ({ icon: 'FaWifi', label: a })),
      verified: false,
      isPrivate: isPrivate,
      interestStatus: interest?.status || null,
      host: {
        name: hostName,
        avatar: property.users?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&background=random`,
        id: property.listed_by_user_id
      },
      description: property.description,
      availableFrom: property.available_from,
      createdAt: property.created_at
    };
  });

  return {
    data: transformedData,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      hasMore: (page * pageSize) < (count || 0)
    }
  };
}

export async function POST(req) {
  return handleCreateProperty(req);
}
