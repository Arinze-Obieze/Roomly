import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { bumpCacheVersion } from '@/core/utils/redis';
import { recomputeForProperty } from '@/core/services/matching/recompute-compatibility.service';
import { asyncRebuildFeedsForProperty } from '@/core/services/feeds/rebuild-feed.service';
import { upsertPropertyMatchingSnapshot } from '@/core/services/matching/features/snapshot.service';
import { asyncRebuildFindPeopleShortlistsForProperty } from '@/core/services/matching/precompute/find-people-shortlist';
import { getPropertyCreationVersionKeys } from '@/core/services/matching/matching-cache-versions';

const FILE_LIMITS = {
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  VIDEO_MAX_BYTES: 20 * 1024 * 1024,
  ABSOLUTE_MAX_BYTES: 20 * 1024 * 1024,
};

const ALLOWED_MIMES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
};

const validateFile = (file, type) => {
  if (!file || typeof file === 'string') {
    return { valid: false, error: 'Invalid file' };
  }

  const maxSize = type === 'image' ? FILE_LIMITS.IMAGE_MAX_BYTES : FILE_LIMITS.VIDEO_MAX_BYTES;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${type === 'image' ? 'Image' : 'Video'} must be under ${Math.floor(maxSize / (1024 * 1024))}MB`,
    };
  }

  if (file.size > FILE_LIMITS.ABSOLUTE_MAX_BYTES) {
    return { valid: false, error: 'File exceeds maximum size limit of 20MB' };
  }

  const allowedMimes = ALLOWED_MIMES[type] || [];
  if (!allowedMimes.includes(file.type)) {
    return { valid: false, error: `Invalid ${type} format` };
  }

  return { valid: true };
};

const readNumber = (form, key) => {
  const value = form.get(key);
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const readBool = (form, key) => form.get(key) === 'true';

const readJson = (form, key, fallback = []) => {
  try {
    const raw = form.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const collectMediaFiles = (form) => {
  const photos = [
    ...form.getAll('new_photos[]'),
    ...form.getAll('photos[]'),
  ];

  const videos = [
    ...form.getAll('new_videos[]'),
    ...form.getAll('videos[]'),
  ];

  return {
    photos: photos.filter((file) => file && typeof file !== 'string'),
    videos: videos.filter((file) => file && typeof file !== 'string'),
  };
};

const cleanupProperty = async (supabase, propertyId) => {
  try {
    await supabase.from('properties').delete().eq('id', propertyId);
  } catch (error) {
    console.error('[Property Create] Cleanup failed');
  }
};

const cleanupUploadedFiles = async (supabase, paths) => {
  if (!paths || paths.length === 0) return;

  try {
    await supabase.storage.from('property-media').remove(paths);
  } catch (error) {
    console.error('[Property Create] Uploaded file cleanup failed');
  }
};

export async function handleCreateProperty(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const form = await req.formData();
    const propertyType = form.get('property_category') || form.get('property_type');

    const requiredFields = ['title', 'description', 'price_per_month', 'state', 'city', 'street'];
    for (const field of requiredFields) {
      if (!form.get(field)) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    if (!propertyType) {
      return NextResponse.json(
        { error: 'Missing field: property_category (or property_type)' },
        { status: 400 }
      );
    }

    const pricePerMonth = readNumber(form, 'price_per_month');
    const bedrooms = readNumber(form, 'bedrooms');
    const bathrooms = readNumber(form, 'bathrooms');
    const latitude = readNumber(form, 'latitude');
    const longitude = readNumber(form, 'longitude');

    if (pricePerMonth === null || pricePerMonth <= 0) {
      return NextResponse.json({ error: 'Price per month must be a positive number' }, { status: 400 });
    }

    if (bedrooms !== null && bedrooms < 0) {
      return NextResponse.json({ error: 'Bedrooms cannot be negative' }, { status: 400 });
    }

    if (bathrooms !== null && bathrooms < 0) {
      return NextResponse.json({ error: 'Bathrooms cannot be negative' }, { status: 400 });
    }

    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ error: 'Invalid latitude (must be between -90 and 90)' }, { status: 400 });
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ error: 'Invalid longitude (must be between -180 and 180)' }, { status: 400 });
    }

    const { photos, videos } = collectMediaFiles(form);

    if (photos.length < 1) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }

    if (photos.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 photos allowed' }, { status: 400 });
    }

    if (videos.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 videos allowed' }, { status: 400 });
    }

    for (const file of photos) {
      const result = validateFile(file, 'image');
      if (!result.valid) {
        return NextResponse.json({ error: `File validation failed: ${result.error}` }, { status: 400 });
      }
    }

    for (const file of videos) {
      const result = validateFile(file, 'video');
      if (!result.valid) {
        return NextResponse.json({ error: `File validation failed: ${result.error}` }, { status: 400 });
      }
    }

    // ─── Derive filter-compatible fields from existing form data ──────────────
    // bills_included: true only when landlord chose "Yes, All bills included"
    const billsOption = form.get('bills_option') || 'some';
    const billsIncluded = billsOption === 'box';

    // house_rules: assemble from deal_breakers array + couples_allowed toggle
    // The filter expects: 'no_smoking', 'pets_allowed', 'couples_welcome', 'students_welcome'
    const dealBreakers = readJson(form, 'deal_breakers', []);
    const couplesAllowed = readBool(form, 'couples_allowed');
    const houseRules = [];
    // deal_breakers are things NOT allowed — map to positive "allowed" rules
    if (!dealBreakers.includes('smokers'))   houseRules.push('no_smoking');
    if (!dealBreakers.includes('pets'))      houseRules.push('pets_allowed');
    if (couplesAllowed)                      houseRules.push('couples_welcome');
    if (!dealBreakers.includes('students'))  houseRules.push('students_welcome');

    const propertyData = {
      title: form.get('title'),
      description: form.get('description'),
      rental_type: form.get('rental_type') || 'monthly',
      fixed_term_duration: readNumber(form, 'fixed_term_duration'),
      property_type: propertyType,
      offering_type: form.get('offering_type') || 'private_room',
      bedrooms: bedrooms ?? 0,
      bathrooms: bathrooms ?? 0,
      square_meters: readNumber(form, 'floor_area') ?? readNumber(form, 'square_meters'),
      year_built: readNumber(form, 'year_built'),
      ber_rating: form.get('ber_rating'),
      state: form.get('state'),
      city: form.get('city'),
      street: form.get('street'),
      latitude,
      longitude,
      transport_options: readJson(form, 'transport_options', []),
      is_gaeltacht: readBool(form, 'is_gaeltacht'),
      price_per_month: pricePerMonth,
      deposit: readNumber(form, 'deposit'),
      bills_option: billsOption,
      custom_bills: readJson(form, 'custom_bills', []),
      couples_allowed: couplesAllowed,
      payment_methods: readJson(form, 'payment_methods', []),
      amenities: readJson(form, 'amenities', []),
      occupation_preference: form.get('occupation_preference') || 'any',
      gender_preference: form.get('gender_preference') || 'any',
      age_min: readNumber(form, 'age_min') || 18,
      age_max: readNumber(form, 'age_max') || 99,
      lifestyle_priorities: readJson(form, 'lifestyle_priorities', {}),
      deal_breakers: dealBreakers,
      partner_description: form.get('partner_description'),
      available_from: form.get('available_from') || null,
      is_immediate: readBool(form, 'is_immediate'),
      min_stay_months: readNumber(form, 'min_stay_months') || 6,
      accept_viewings: readBool(form, 'accept_viewings'),
      listed_by_user_id: user.id,
      is_active: true,
      is_public: form.get('is_public') !== null ? readBool(form, 'is_public') : true,
      status: 'available',
      // Filter columns (require db_migration_filter_columns.sql to be run first)
      room_type: form.get('room_type') || null,
      house_rules: houseRules,
      approval_status: 'pending',
      // Note: bills_included is a GENERATED column in Postgres — no need to insert it
    };

    const { data: property, error: propertyInsertError } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (propertyInsertError) {
      const isPermissionError =
        propertyInsertError.code === '42501' ||
        propertyInsertError.message?.toLowerCase().includes('row-level security');

      if (isPermissionError) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }

      console.error('[Property Create] Property insert failed');
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
    }

    const mediaRecords = [];
    const uploadedPaths = [];
    let photoOrder = 0;
    let videoOrder = 100;

    try {
      for (const file of photos) {
        photoOrder += 1;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${property.id}/image_${photoOrder}_${crypto.randomUUID()}.${extension}`;

        const { data: upload, error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(path, file, { contentType: file.type });

        if (uploadError || !upload?.path) {
          throw new Error('Image upload failed');
        }

        uploadedPaths.push(upload.path);

        mediaRecords.push({
          property_id: property.id,
          url: upload.path,
          media_type: 'image',
          is_primary: photoOrder === 1,
          display_order: photoOrder,
        });
      }

      for (const file of videos) {
        videoOrder += 1;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'mp4';
        const path = `${user.id}/${property.id}/video_${videoOrder}_${crypto.randomUUID()}.${extension}`;

        const { data: upload, error: uploadError } = await supabase.storage
          .from('property-media')
          .upload(path, file, { contentType: file.type });

        if (uploadError || !upload?.path) {
          throw new Error('Video upload failed');
        }

        uploadedPaths.push(upload.path);

        mediaRecords.push({
          property_id: property.id,
          url: upload.path,
          media_type: 'video',
          is_primary: false,
          display_order: videoOrder,
        });
      }

      if (mediaRecords.length > 0) {
        const { error: mediaInsertError } = await supabase.from('property_media').insert(mediaRecords);
        if (mediaInsertError) {
          throw new Error('Media record insert failed');
        }
      }
    } catch (error) {
      console.error('[Property Create] Media processing failed');
      await cleanupUploadedFiles(supabase, uploadedPaths);
      await cleanupProperty(supabase, property.id);
      return NextResponse.json({ error: 'Failed to process media files' }, { status: 500 });
    }

    // Recompute compatibility synchronously for this new property so production
    // feeds and find-people views are fresh immediately after listing creation.
    try {
      const admin = createAdminClient();
      await recomputeForProperty(admin, property.id);
      await Promise.all([
        upsertPropertyMatchingSnapshot(admin, property.id),
        asyncRebuildFeedsForProperty(property.id, admin),
        asyncRebuildFindPeopleShortlistsForProperty(property.id, admin),
      ]);
    } catch (recomputeError) {
      console.error('[Property Create] Recompute failed:', recomputeError?.message || recomputeError);
    }

    await Promise.all(
      getPropertyCreationVersionKeys({
        propertyId: property.id,
        ownerUserId: user.id,
      }).map((key) => bumpCacheVersion(key))
    );

    return NextResponse.json({
      success: true,
      property_id: property.id,
    });
  } catch (error) {
    console.error('[Property Create] Unexpected error');
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
