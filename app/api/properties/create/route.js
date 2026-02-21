import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

// File size limits (in bytes)
const FILE_LIMITS = {
  DEFAULT_IMAGE: 5 * 1024 * 1024, // 5MB for images
  DEFAULT_VIDEO: 50 * 1024 * 1024, // 50MB for videos
  ABSOLUTE_MAX: 20 * 1024 * 1024, // 20MB absolute max per file
};

// Allowed MIME types
const ALLOWED_MIMES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
};

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {string} type - 'image' or 'video'
 * @returns {{valid: boolean, error?: string}}
 */
const validateFile = (file, type) => {
  if (!file || typeof file === 'string') {
    return { valid: false, error: 'Invalid file' };
  }

  // Check file size
  const maxSize = type === 'image' ? FILE_LIMITS.DEFAULT_IMAGE : FILE_LIMITS.DEFAULT_VIDEO;
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `${type === 'image' ? 'Image' : 'Video'} must be under ${maxSize / (1024 * 1024)}MB` 
    };
  }

  // Check absolute max
  if (file.size > FILE_LIMITS.ABSOLUTE_MAX) {
    return { 
      valid: false, 
      error: `File exceeds maximum size limit of 20MB` 
    };
  }

  // Check MIME type
  const allowedMimes = ALLOWED_MIMES[type] || [];
  if (!allowedMimes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid ${type} format. Allowed: ${allowedMimes.join(', ')}` 
    };
  }

  return { valid: true };
};

export async function POST(req) {
  try {
    console.log('[DEBUG] Starting property creation request');
    
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[DEBUG] Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required',
      }, { status: 401 });
    }

    const form = await req.formData();
    
    // Required fields check
    const requiredFields = [
      'title', 'description', 
      'property_category', // Maps to property_type
      'price_per_month',
      'state', 'city', 'street'
    ];
    
    for (const field of requiredFields) {
      if (!form.get(field)) {
        return NextResponse.json({ 
          error: `Missing field: ${field}` 
        }, { status: 400 });
      }
    }

    // Helper functions
    const getJson = (key, def = []) => {
        try {
            const val = form.get(key);
            return val ? JSON.parse(val) : def;
        } catch (e) {
            return def; 
        }
    };

    const getNumber = (key) => {
        const val = form.get(key);
        return val ? Number(val) : null;
    };
    
    const getBool = (key) => {
        const val = form.get(key);
        return val === 'true';
    };

    // Validate numeric fields
    const pricePerMonth = getNumber('price_per_month');
    const bedrooms = getNumber('bedrooms');
    const bathrooms = getNumber('bathrooms');
    
    if (pricePerMonth === null || pricePerMonth <= 0) {
      return NextResponse.json({ 
        error: 'Price per month must be a positive number' 
      }, { status: 400 });
    }

    if (bedrooms !== null && bedrooms < 0) {
      return NextResponse.json({ 
        error: 'Bedrooms cannot be negative' 
      }, { status: 400 });
    }

    if (bathrooms !== null && bathrooms < 0) {
      return NextResponse.json({ 
        error: 'Bathrooms cannot be negative' 
      }, { status: 400 });
    }

    // Validate coordinates if provided
    const latitude = getNumber('latitude');
    const longitude = getNumber('longitude');
    
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return NextResponse.json({ 
        error: 'Invalid latitude (must be between -90 and 90)' 
      }, { status: 400 });
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return NextResponse.json({ 
        error: 'Invalid longitude (must be between -180 and 180)' 
      }, { status: 400 });
    }
    
    // Prepare DB object
    const propertyData = {
      // Basics
      title: form.get('title'),
      description: form.get('description'),
      rental_type: form.get('rental_type') || 'monthly',
      fixed_term_duration: getNumber('fixed_term_duration'),
      
      // Property Details
      property_type: form.get('property_category'),
      offering_type: form.get('offering_type') || 'private_room',
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      square_meters: getNumber('floor_area'), // Mapping floor_area -> square_meters
      year_built: getNumber('year_built'),
      ber_rating: form.get('ber_rating'),
      
      // Location
      state: form.get('state'),
      city: form.get('city'),
      street: form.get('street'),
      latitude: latitude,
      longitude: longitude,
      transport_options: getJson('transport_options', []),
      is_gaeltacht: getBool('is_gaeltacht'),
      
      // Financials
      price_per_month: pricePerMonth,
      deposit: getNumber('deposit'),
      bills_option: form.get('bills_option') || 'some',
      custom_bills: getJson('custom_bills', []),
      couples_allowed: getBool('couples_allowed'),
      payment_methods: getJson('payment_methods', []),
      
      // Amenities
      amenities: getJson('amenities', []),
      
      // Preferences
      occupation_preference: form.get('occupation_preference') || 'any',
      gender_preference: form.get('gender_preference') || 'any',
      age_min: getNumber('age_min') || 18,
      age_max: getNumber('age_max') || 99,
      lifestyle_priorities: getJson('lifestyle_priorities', {}),
      partner_description: form.get('partner_description'),
      
      // Availability
      available_from: form.get('available_from') || null,
      is_immediate: getBool('is_immediate'),
      min_stay_months: getNumber('min_stay_months') || 6,
      accept_viewings: getBool('accept_viewings'),
      
      // System
      listed_by_user_id: user.id,
      is_active: true,
      status: 'available',
    };
    
    console.log('[DEBUG] Inserting property:', propertyData);

    const { data: property, error: propErr } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
      
    if (propErr) {
      console.error('[DEBUG] Insert error:', propErr);
      return NextResponse.json({ 
        error: propErr.message 
      }, { status: 500 });
    }

    // Media Upload with validation
    // Handle 'new_photos[]', 'new_videos[]' (from frontend) and 'photos[]', 'videos[]' (legacy/API)
    const files = [
        ...form.getAll('new_photos[]').map(f => ({ file: f, type: 'image' })),
        ...form.getAll('photos[]').map(f => ({ file: f, type: 'image' })),
        ...form.getAll('new_videos[]').map(f => ({ file: f, type: 'video' })),
        ...form.getAll('videos[]').map(f => ({ file: f, type: 'video' })),
    ];
    
    // Validate all files before uploading
    for (const { file, type } of files) {
      if (!file || typeof file === 'string') continue; // Skip non-files
      
      const validation = validateFile(file, type);
      if (!validation.valid) {
        // Clean up property since media upload failed
        await supabase.from('properties').delete().eq('id', property.id);
        return NextResponse.json({ 
          error: `File validation failed: ${validation.error}` 
        }, { status: 400 });
      }
    }
    
    const mediaRecords = [];
    let photoCount = 0;
    let videoCount = 0;

    const uploadPromises = files.map(async ({ file, type }, index) => {
         if (!file || typeof file === 'string') return null; // Skip non-files

         const ext = file.name.split('.').pop().toLowerCase();
         const path = `properties/${property.id}/${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
         
         const { error: uploadErr } = await supabase.storage
            .from('property-media')
            .upload(path, file, { contentType: file.type });
            
         if (uploadErr) {
             console.error('Upload Error:', uploadErr);
             return null;
         }
         
         const { data: { publicUrl } } = supabase.storage
            .from('property-media')
            .getPublicUrl(path);

         const isPhoto = type === 'image';
         if (isPhoto) photoCount++;
         else videoCount++;

         return {
            property_id: property.id,
            url: publicUrl,
            media_type: type,
            is_primary: isPhoto && photoCount === 1,
            display_order: isPhoto ? photoCount : 100 + videoCount,
         };
    });

    const results = await Promise.all(uploadPromises);
    const validMedia = results.filter(Boolean);
    
    if (validMedia.length > 0) {
        const { error: mediaErr } = await supabase.from('property_media').insert(validMedia);
        if (mediaErr) console.error('Media insert error:', mediaErr);
    }

    return NextResponse.json({ 
      success: true, 
      property_id: property.id 
    });
    
  } catch (err) {
    console.error('[DEBUG] Unexpected error:', err);
    return NextResponse.json({ 
      error: err.message || 'Server error' 
    }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}