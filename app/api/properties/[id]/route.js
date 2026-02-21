export const runtime = 'nodejs';

import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cachedFetch, invalidatePattern } from '@/core/utils/redis';
import crypto from 'crypto';

// Generate cache key for property details (includes user for personalized data)
const generateCacheKey = (propertyId, userId = 'anon') => {
  const hash = crypto
    .createHash('md5')
    .update(`${propertyId}:${userId}`)
    .digest('hex');

  return `property:${hash}`;
};

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';

    const cacheKey = generateCacheKey(id, userId);

    const cachedData = await cachedFetch(cacheKey, 600, async () => {
      return fetchPropertyFromDB(supabase, id, user);
    });

    return NextResponse.json(cachedData);

  } catch (error) {
    console.error('[Property Details GET] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchPropertyFromDB(supabase, id, user) {
  let interestStatus = null;

  if (user) {
    const { data: interest } = await supabase
      .from('property_interests')
      .select('status')
      .eq('property_id', id)
      .eq('seeker_id', user.id)
      .maybeSingle();

    interestStatus = interest?.status;
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (
        id,
        url,
        display_order,
        is_primary,
        media_type
      ),
      users (
        id,
        full_name,
        profile_picture,
        is_verified,
        privacy_setting
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!property) throw new Error('Property not found');

  const isMutualInterest = interestStatus === 'accepted';
  const isPrivate = property.privacy_setting === 'private';
  const shouldMask = isPrivate && !isMutualInterest;

  // Normalize media URLs
  if (property.property_media?.length) {
    property.property_media = property.property_media.map(media => ({
      ...media,
      url: media.url.startsWith('http')
        ? media.url
        : supabase.storage
            .from('property-media')
            .getPublicUrl(media.url).data.publicUrl
    }));
  } else {
    property.property_media = [{
      id: 'placeholder',
      url: 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image',
      media_type: 'image',
      is_primary: true
    }];
  }

  if (shouldMask) {
    property.title = `Room in ${property.city}`;
    property.street = undefined;
    property.price_range =
      `€${Math.floor(property.price_per_month / 100) * 100}-` +
      `€${Math.ceil(property.price_per_month / 100) * 100}`;
    property.price_per_month = undefined;
    property.description = property.description?.slice(0, 100) + '...';
    property.isBlurry = true;

    if (property.users?.full_name) {
      const [first, last] = property.users.full_name.split(' ');
      property.users.full_name = last ? `${first} ${last[0]}.` : first;
    }
  } else if (!user) {
    property.street = undefined;

    if (property.users?.full_name) {
      property.users.full_name = property.users.full_name.split(' ')[0];
    }
  }

  return {
    ...property,
    isPrivate,
    interestStatus
  };
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let updates = {};
    let existingPhotos = [];
    let newPhotos = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      updates = {
        title: formData.get('title'),
        description: formData.get('description'),
        property_type: formData.get('property_type'),
        price_per_month: formData.get('price_per_month'),
        state: formData.get('state'),
        city: formData.get('city'),
        street: formData.get('street'),
        bedrooms: formData.get('bedrooms'),
        bathrooms: formData.get('bathrooms'),
        square_meters: formData.get('square_meters'),
        available_from: formData.get('available_from'),
        amenities: JSON.parse(formData.get('amenities') || '[]')
      };

      existingPhotos = formData.getAll('existing_photos[]');
      newPhotos = formData.getAll('new_photos[]');
    } else {
      updates = await request.json();
    }

    const { data: existingProperty } = await supabase
      .from('properties')
      .select('listed_by_user_id')
      .eq('id', id)
      .single();

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (existingProperty.listed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await invalidatePattern(`property:*`);
    await invalidatePattern('properties:list:*');

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Property Details PUT] Error:', error);

    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingProperty } = await supabase
      .from('properties')
      .select('listed_by_user_id')
      .eq('id', id)
      .single();

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (existingProperty.listed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase.rpc('delete_property', {
      p_id: id
    });

    if (error) throw error;

    await invalidatePattern(`property:*`);
    await invalidatePattern('properties:list:*');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Property Details DELETE] Error:', error);

    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}