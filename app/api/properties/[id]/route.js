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

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeMediaPath = (value) => {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http')) {
    const marker = '/storage/v1/object/public/property-media/';
    const index = value.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(value.slice(index + marker.length));
    }
  }
  return value;
};

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let updates = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const propertyType = formData.get('property_category') || formData.get('property_type');
      const squareMeters = formData.get('floor_area') || formData.get('square_meters');

      updates = {
        title: formData.get('title'),
        description: formData.get('description'),
        property_type: propertyType,
        price_per_month: formData.get('price_per_month') ? Number(formData.get('price_per_month')) : undefined,
        state: formData.get('state'),
        city: formData.get('city'),
        street: formData.get('street'),
        bedrooms: formData.get('bedrooms') ? Number(formData.get('bedrooms')) : undefined,
        bathrooms: formData.get('bathrooms') ? Number(formData.get('bathrooms')) : undefined,
        square_meters: squareMeters ? Number(squareMeters) : undefined,
        available_from: formData.get('available_from'),
        amenities: parseJsonArray(formData.get('amenities')),
      };
      updates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      );

      const existingPhotoPaths = formData
        .getAll('existing_photos[]')
        .map((value) => normalizeMediaPath(String(value)))
        .filter(Boolean);
      const newPhotos = formData
        .getAll('new_photos[]')
        .filter((file) => file && typeof file !== 'string');
      const newVideos = formData
        .getAll('new_videos[]')
        .filter((file) => file && typeof file !== 'string');

      for (const file of newPhotos) {
        if (!file.type?.startsWith('image/')) {
          return NextResponse.json({ error: 'All photos must be images' }, { status: 400 });
        }
      }

      for (const file of newVideos) {
        if (!file.type?.startsWith('video/')) {
          return NextResponse.json({ error: 'All videos must be videos' }, { status: 400 });
        }
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

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (propertyError) throw propertyError;

      const { data: currentMedia, error: mediaQueryError } = await supabase
        .from('property_media')
        .select('id, url, media_type, display_order, is_primary')
        .eq('property_id', id)
        .order('display_order', { ascending: true });

      if (mediaQueryError) throw mediaQueryError;

      const currentImages = (currentMedia || []).filter((item) => item.media_type === 'image');
      const currentVideos = (currentMedia || []).filter((item) => item.media_type === 'video');

      const requestedImageSet = new Set(existingPhotoPaths);
      const keptImages = currentImages.filter((item) => requestedImageSet.has(normalizeMediaPath(item.url)));
      const deletedImages = currentImages.filter((item) => !requestedImageSet.has(normalizeMediaPath(item.url)));

      if (keptImages.length + newPhotos.length === 0) {
        return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
      }

      if (keptImages.length + newPhotos.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 photos allowed' }, { status: 400 });
      }

      if (currentVideos.length + newVideos.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 videos allowed' }, { status: 400 });
      }

      if (deletedImages.length > 0) {
        const idsToDelete = deletedImages.map((item) => item.id);
        const pathsToDelete = deletedImages
          .map((item) => normalizeMediaPath(item.url))
          .filter((path) => path && !path.startsWith('http'));

        await supabase.from('property_media').delete().in('id', idsToDelete);
        if (pathsToDelete.length > 0) {
          await supabase.storage.from('property-media').remove(pathsToDelete);
        }
      }

      // Re-order retained images in the same order sent by the client.
      const retainedByPath = new Map(keptImages.map((item) => [normalizeMediaPath(item.url), item]));
      const orderedRetainedImages = existingPhotoPaths
        .map((path) => retainedByPath.get(path))
        .filter(Boolean);

      for (let index = 0; index < orderedRetainedImages.length; index += 1) {
        const mediaItem = orderedRetainedImages[index];
        await supabase
          .from('property_media')
          .update({
            display_order: index + 1,
            is_primary: index === 0 && newPhotos.length === 0,
          })
          .eq('id', mediaItem.id);
      }

      const newMediaRows = [];
      let photoOrder = orderedRetainedImages.length;
      let videoOrder = currentVideos.length > 0
        ? Math.max(...currentVideos.map((item) => item.display_order || 100), 100)
        : 100;

      for (const file of newPhotos) {
        photoOrder += 1;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `properties/${id}/image_${photoOrder}_${crypto.randomUUID()}.${extension}`;
        const { data: upload, error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(path, file, { contentType: file.type });
        if (uploadError || !upload?.path) {
          throw new Error('Photo upload failed');
        }

        newMediaRows.push({
          property_id: id,
          url: upload.path,
          media_type: 'image',
          display_order: photoOrder,
          is_primary: orderedRetainedImages.length === 0 && photoOrder === 1,
        });
      }

      for (const file of newVideos) {
        videoOrder += 1;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `properties/${id}/video_${videoOrder}_${crypto.randomUUID()}.${extension}`;
        const { data: upload, error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(path, file, { contentType: file.type });
        if (uploadError || !upload?.path) {
          throw new Error('Video upload failed');
        }

        newMediaRows.push({
          property_id: id,
          url: upload.path,
          media_type: 'video',
          display_order: videoOrder,
          is_primary: false,
        });
      }

      if (newMediaRows.length > 0) {
        const { error: mediaInsertError } = await supabase.from('property_media').insert(newMediaRows);
        if (mediaInsertError) throw mediaInsertError;
      }

      await invalidatePattern(`property:*`);
      await invalidatePattern('properties:list:*');
      await invalidatePattern('seeker:interests:*');
      await invalidatePattern('landlord:interests:*');

      return NextResponse.json(propertyData);
    }

    updates = await request.json();
    if (updates.property_category && !updates.property_type) {
      updates.property_type = updates.property_category;
    }
    if (updates.floor_area && !updates.square_meters) {
      updates.square_meters = updates.floor_area;
    }
    if (typeof updates.amenities === 'string') {
      updates.amenities = parseJsonArray(updates.amenities);
    }
    updates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

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
    await invalidatePattern('seeker:interests:*');
    await invalidatePattern('landlord:interests:*');

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
    const { id } = await params;

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
