export const runtime = 'nodejs';

import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { cachedFetch, getCachedInt, bumpCacheVersion } from '@/core/utils/redis';
import crypto from 'crypto';
import { recomputeForProperty } from '@/core/services/matching/recompute-compatibility.service';
import { asyncRebuildFeedsForProperty } from '@/core/services/feeds/rebuild-feed.service';
import { upsertPropertyMatchingSnapshot } from '@/core/services/matching/features/snapshot.service';
import { asyncRebuildFindPeopleShortlistsForProperty, rebuildHostFindPeopleShortlist } from '@/core/services/matching/precompute/find-people-shortlist';
import { getPropertyCreationVersionKeys } from '@/core/services/matching/matching-cache-versions';
import {
  canSeePrivateListing,
  getPropertyContactState,
  isPrivateListing,
  shouldMaskPrivateListing,
} from '@/core/services/matching/rules/property-visibility';
import { getMatchConfidenceState } from '@/core/services/matching/presentation/match-confidence';
import { buildPropertyMatchReasons } from '@/core/services/matching/presentation/match-explanations';
import { propertyMatchConfidence } from '@/lib/matching/propertyMatchScore';
import { buildPropertyDetailCacheKey } from '@/core/services/properties/property-detail-cache';
import { buildPropertyMultipartUpdates, parseJsonArrayField } from '@/core/services/properties/property-multipart-updates';
import { validateCSRFRequest } from '@/core/utils/csrf';

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
    const adminSb = createAdminClient();
    const { id } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anon';

    const versions = {
      global: await getCachedInt('v:properties:global', 1),
      user: user?.id ? await getCachedInt(`v:properties:user:${user.id}`, 1) : 0,
      property: await getCachedInt(`v:property:${id}`, 1),
    };
    const cacheKey = buildPropertyDetailCacheKey(id, userId, versions);

    const cachedData = await cachedFetch(cacheKey, 600, async () => {
      return fetchPropertyFromDB(supabase, adminSb, id, user);
    });

    return NextResponse.json(cachedData);

  } catch (error) {
    console.error('[Property Details GET] Error:', error);

    if (error?.statusCode === 404) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchPropertyFromDB(supabase, adminSb, id, user) {
  let interestStatus = null;
  let matchScore = null;
  let missingProfile = false;
  const userId = user?.id || null;
  let seekerLifestyle = null;
  let seekerPrefs = null;
  let seekerMeta = {};
  let hostLifestyle = null;

  if (userId) {
    const [{ data: interest }, { data: scoreRow }, { data: lifestyleRow }, { data: prefsRow }, { data: userMetaRow }] = await Promise.all([
      supabase
        .from('property_interests')
        .select('status')
        .eq('property_id', id)
        .eq('seeker_id', userId)
        .maybeSingle(),
      supabase
        .from('compatibility_scores')
        .select('score')
        .eq('property_id', id)
        .eq('seeker_id', userId)
        .maybeSingle(),
      supabase
        .from('user_lifestyles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('match_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('users')
        .select('id, gender, date_of_birth')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    interestStatus = interest?.status;
    matchScore = scoreRow?.score ?? null;
    seekerLifestyle = lifestyleRow || null;
    seekerPrefs = prefsRow || null;
    seekerMeta = userMetaRow || {};
    missingProfile = !lifestyleRow && !prefsRow;
  }

  const { data: property, error } = await adminSb
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
      users!listed_by_user_id (
        id,
        full_name,
        profile_picture,
        is_verified,
        gender,
        date_of_birth,
        privacy_setting,
        last_seen,
        average_response_time_ms,
        show_online_status,
        show_response_time
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!property) throw new Error('Property not found');

  if (property.listed_by_user_id) {
    const { data: hostLifestyleRow } = await adminSb
      .from('user_lifestyles')
      .select('user_id, schedule_type, cleanliness_level, social_level, noise_tolerance, interests, overnight_guests, smoking_status, pets, occupation')
      .eq('user_id', property.listed_by_user_id)
      .maybeSingle();
    hostLifestyle = hostLifestyleRow || null;
  }

  const isMutualInterest = interestStatus === 'accepted';
  const isPrivate = isPrivateListing(property);
  const isOwner = !!userId && property.listed_by_user_id === userId;

  // Eligibility for opening a private listing by ID:
  // - owner can always view
  // - accepted interest can view
  // - match >= 70 can view, but still masked until accepted
  if (!canSeePrivateListing({
    isPrivate,
    isOwner,
    hasAcceptedInterest: isMutualInterest,
    matchScore,
  })) {
    const err = new Error('Not found');
    err.statusCode = 404;
    throw err;
  }

  const shouldMask = shouldMaskPrivateListing({
    isPrivate,
    isOwner,
    hasAcceptedInterest: isMutualInterest,
  });

  const { visibility, contactGate, contactAllowed } = getPropertyContactState({
    property,
    isOwner,
    hasAcceptedInterest: isMutualInterest,
    matchScore,
    missingProfile,
  });

  const matchConfidence = user && !isOwner && matchScore != null
    ? propertyMatchConfidence(
      property,
      seekerLifestyle,
      seekerPrefs,
      seekerMeta,
      null,
      property.users || {}
    )
    : null;
  const matchConfidenceState = matchConfidence != null
    ? getMatchConfidenceState(matchConfidence)
    : null;
  const matchReasons = user && !isOwner && matchScore != null
    ? buildPropertyMatchReasons({
      property,
      seekerLifestyle,
      seekerPrefs,
      hostLifestyle,
    })
    : [];

  // Normalize media URLs
  if (property.property_media?.length) {
    property.property_media = property.property_media.map(media => ({
      ...media,
      url: media.url.startsWith('http')
        ? media.url
        : adminSb.storage
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
    visibility,
    isOwner,
    interestStatus,
    matchScore,
    compatibilityScore: matchScore,
    matchConfidence,
    confidenceScore: matchConfidence,
    matchConfidenceState: matchConfidenceState?.state || null,
    matchConfidenceLabel: matchConfidenceState?.label || null,
    matchReasons,
    missingProfile,
    contactGate,
    contactAllowed,
  };
}

export async function PUT(request, { params }) {
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

    const contentType = request.headers.get('content-type') || '';
    let updates = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      updates = buildPropertyMultipartUpdates(formData);

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

      const { data: currentMedia, error: mediaQueryError } = await supabase
        .from('property_media')
        .select('id, url, media_type, display_order, is_primary')
        .eq('property_id', id)
        .order('display_order', { ascending: true });

      if (mediaQueryError) throw mediaQueryError;

      const existingPhotoPaths = formData
        .getAll('existing_photos[]')
        .map((value) => normalizeMediaPath(String(value)))
        .filter(Boolean);
      const existingVideoPathsRaw = formData
        .getAll('existing_videos[]')
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

      const currentImages = (currentMedia || []).filter((item) => item.media_type === 'image');
      const currentVideos = (currentMedia || []).filter((item) => item.media_type === 'video');

      const requestedImageSet = new Set(existingPhotoPaths);
      const requestedVideoSet = new Set(
        existingVideoPathsRaw.length > 0
          ? existingVideoPathsRaw
          : currentVideos.map((item) => normalizeMediaPath(item.url))
      );
      const keptImages = currentImages.filter((item) => requestedImageSet.has(normalizeMediaPath(item.url)));
      const deletedImages = currentImages.filter((item) => !requestedImageSet.has(normalizeMediaPath(item.url)));
      const keptVideos = currentVideos.filter((item) => requestedVideoSet.has(normalizeMediaPath(item.url)));
      const deletedVideos = currentVideos.filter((item) => !requestedVideoSet.has(normalizeMediaPath(item.url)));

      if (keptImages.length + newPhotos.length === 0) {
        return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
      }

      if (keptImages.length + newPhotos.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 photos allowed' }, { status: 400 });
      }

      if (keptVideos.length + newVideos.length > 5) {
        return NextResponse.json({ error: 'Maximum 5 videos allowed' }, { status: 400 });
      }

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (propertyError) throw propertyError;

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

      if (deletedVideos.length > 0) {
        const idsToDelete = deletedVideos.map((item) => item.id);
        const pathsToDelete = deletedVideos
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

      const adminSb = createAdminClient();
      try {
        await recomputeForProperty(adminSb, id);
        await Promise.all([
          upsertPropertyMatchingSnapshot(adminSb, id),
          asyncRebuildFeedsForProperty(id, adminSb),
          asyncRebuildFindPeopleShortlistsForProperty(id, adminSb),
        ]);
      } catch (recomputeError) {
        console.error('[Property Details PUT] Recompute failed:', recomputeError?.message || recomputeError);
      }

      await Promise.all([
        ...getPropertyCreationVersionKeys({
          propertyId: id,
          ownerUserId: user.id,
        }).map((key) => bumpCacheVersion(key)),
      ]);

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
      updates.amenities = parseJsonArrayField(updates.amenities);
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

    const adminSb = createAdminClient();
    try {
      await recomputeForProperty(adminSb, id);
      await Promise.all([
        upsertPropertyMatchingSnapshot(adminSb, id),
        asyncRebuildFeedsForProperty(id, adminSb),
        asyncRebuildFindPeopleShortlistsForProperty(id, adminSb),
      ]);
    } catch (recomputeError) {
      console.error('[Property Details PUT] Recompute failed:', recomputeError?.message || recomputeError);
    }

    await Promise.all([
      ...getPropertyCreationVersionKeys({
        propertyId: id,
        ownerUserId: user.id,
      }).map((key) => bumpCacheVersion(key)),
    ]);

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

    try {
      await rebuildHostFindPeopleShortlist(createAdminClient(), existingProperty.listed_by_user_id);
    } catch (refreshError) {
      console.error('[Property Details DELETE] Find-people shortlist refresh failed:', refreshError?.message || refreshError);
    }

    await Promise.all([
      ...getPropertyCreationVersionKeys({
        propertyId: id,
        ownerUserId: existingProperty.listed_by_user_id,
      }).map((key) => bumpCacheVersion(key)),
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Property Details DELETE] Error:', error);

    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
