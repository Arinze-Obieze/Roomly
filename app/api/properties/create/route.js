import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

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

    // Prepare DB object
    const propertyData = {
      // Basics
      title: form.get('title'),
      description: form.get('description'),
      rental_type: form.get('rental_type') || 'monthly',
      
      // Property Details
      property_type: form.get('property_category'),
      offering_type: form.get('offering_type') || 'private_room',
      bedrooms: getNumber('bedrooms') || 0,
      bathrooms: getNumber('bathrooms') || 0,
      square_meters: getNumber('floor_area'), // Mapping floor_area -> square_meters
      year_built: getNumber('year_built'),
      ber_rating: form.get('ber_rating'),
      
      // Location
      state: form.get('state'),
      city: form.get('city'),
      street: form.get('street'),
      latitude: getNumber('latitude'),
      longitude: getNumber('longitude'),
      transport_options: getJson('transport_options', []),
      is_gaeltacht: getBool('is_gaeltacht'),
      
      // Financials
      price_per_month: getNumber('price_per_month'),
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

    // Media Upload
    // Handle 'new_photos[]', 'new_videos[]' (from frontend) and 'photos[]', 'videos[]' (legacy/API)
    const files = [
        ...form.getAll('new_photos[]').map(f => ({ file: f, type: 'image' })),
        ...form.getAll('photos[]').map(f => ({ file: f, type: 'image' })),
        ...form.getAll('new_videos[]').map(f => ({ file: f, type: 'video' })),
        ...form.getAll('videos[]').map(f => ({ file: f, type: 'video' })),
    ];
    
    const mediaRecords = [];
    
    // Sequential upload to ensure order is preserved if needed, or mapped
    // But parallel is faster. We need to assign display_order.
    
    let photoCount = 0;
    let videoCount = 0;

    const uploadPromises = files.map(async ({ file, type }, index) => {
         if (!file || typeof file === 'string') return null; // Skip non-files

         const ext = file.name.split('.').pop();
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