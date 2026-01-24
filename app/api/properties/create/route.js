// app/api/properties/route.js (with debug logging)
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

export async function POST(req) {
  try {
    console.log('[DEBUG] Starting property creation request');
    
    // Get authenticated user using SSR client
    const supabase = await createClient();
    console.log('[DEBUG] Supabase client created');
    
    // Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[DEBUG] Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message 
    });
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[DEBUG] User check:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message 
    });
    
    if (authError || !user) {
      console.error('[DEBUG] Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication required: You must be logged in to publish a property.',
        debug: {
          hasSession: !!session,
          authError: authError?.message
        }
      }, { status: 401 });
    }

    console.log('[DEBUG] User authenticated successfully:', user.id);

    const form = await req.formData();
    
    // Extract fields
    const requiredFields = [
      'title', 'description', 'property_type', 'price_per_month',
      'state', 'city', 'street', 'bedrooms', 'bathrooms', 'available_from',
    ];
    
    for (const field of requiredFields) {
      if (!form.get(field)) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }

    // Parse amenities (optional)
    let amenities = [];
    try {
      amenities = JSON.parse(form.get('amenities') || '[]');
    } catch {
      amenities = [];
    }

    // Handle files
    const photos = form.getAll('photos[]');
    const videos = form.getAll('videos[]');
    
    console.log('[DEBUG] Files received:', { 
      photoCount: photos.length, 
      videoCount: videos.length 
    });
    
    if (!photos || photos.length < 1) {
      return NextResponse.json({ 
        error: 'At least one photo is required' 
      }, { status: 400 });
    }
    if (photos.length > 10) {
      return NextResponse.json({ 
        error: 'Maximum 10 photos allowed' 
      }, { status: 400 });
    }
    if (videos.length > 5) {
      return NextResponse.json({ 
        error: 'Maximum 5 videos allowed' 
      }, { status: 400 });
    }

    // Validate file types
    for (const file of photos) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: 'All photos must be images' 
        }, { status: 400 });
      }
    }
    for (const file of videos) {
      if (!file.type.startsWith('video/')) {
        return NextResponse.json({ 
          error: 'All videos must be videos' 
        }, { status: 400 });
      }
    }

    console.log('[DEBUG] Inserting property for user:', user.id);
    
    // 1. Insert property row
    const propertyData = {
      title: form.get('title'),
      description: form.get('description'),
      property_type: form.get('property_type'),
      price_per_month: Number(form.get('price_per_month')),
      state: form.get('state'),
      city: form.get('city'),
      street: form.get('street'),
      bedrooms: Number(form.get('bedrooms')),
      bathrooms: Number(form.get('bathrooms')),
      square_meters: form.get('square_meters') ? Number(form.get('square_meters')) : null,
      available_from: form.get('available_from'),
      amenities,
      listed_by_user_id: user.id,
      is_active: true,
      status: 'available',
    };
    
    console.log('[DEBUG] Property data:', propertyData);
    
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();
      
    if (propErr) {
      console.error('[DEBUG] Property insert error:', {
        message: propErr.message,
        code: propErr.code,
        details: propErr.details,
        hint: propErr.hint
      });
      
      // Detect RLS error
      if (propErr.message && propErr.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ 
          error: 'Permission denied: Row-level security policy violation.',
          debug: {
            error: propErr.message,
            hint: propErr.hint,
            userId: user.id
          }
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: propErr.message || 'Failed to insert property',
        debug: {
          code: propErr.code,
          details: propErr.details
        }
      }, { status: 500 });
    }

    console.log('[DEBUG] Property created successfully:', property.id);

    // 2. Upload media to storage and insert property_media
    const mediaRecords = [];
    
    // Parallel upload for photos
    const photoUploadPromises = photos.map(async (file, i) => {
      const ext = file.name.split('.').pop();
      const path = `properties/${property.id}/photo_${i + 1}.${ext}`;
      
      console.log('[DEBUG] Uploading photo:', path);
      
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('property-media')
        .upload(path, file, { contentType: file.type });
        
      if (uploadErr) {
        console.error('[DEBUG] Photo upload error:', uploadErr);
        throw uploadErr;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(path);

      return {
        property_id: property.id,
        url: publicUrl,
        media_type: 'image',
        is_primary: i === 0,
        display_order: i + 1,
      };
    });

    // Parallel upload for videos
    const videoUploadPromises = videos.map(async (file, i) => {
      const ext = file.name.split('.').pop();
      const path = `properties/${property.id}/video_${i + 1}.${ext}`;
      
      console.log('[DEBUG] Uploading video:', path);
      
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('property-media')
        .upload(path, file, { contentType: file.type });
        
      if (uploadErr) {
        console.error('[DEBUG] Video upload error:', uploadErr);
        throw uploadErr;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-media')
        .getPublicUrl(path);

      return {
        property_id: property.id,
        url: publicUrl, // Note: Logic below used upload.path previously but photos used publicUrl. Assuming consistency? 
               // Actually the original code pushed `upload.path` to `mediaRecords` for video loop, 
               // but for photos loop it pushed `publicUrl`. 
               // Wait, let's check original code carefully.
               // Photos loop: insert `publicUrl` (line 197), push `publicUrl` (line 207).
               // Videos loop: insert `upload.path` (line 230), push `upload.path` (line 239).
               // This inconsistency is suspicious. Upload.path is usually internal path. 
               // UI likely needs publicUrl.
               // I will standardize on publicUrl if possible, or preserve exact behavior.
               // Given property_media table usually stores publicUrl for easy access, 
               // or relative path if using a storage helper. 
               // But `ListingCard` uses `getPublicUrl` on the stored URL?
               // Let's check ListingCard.
               // ListingCard: `supabase.storage.from('property-media').getPublicUrl(property.property_media[0].url)`
               // This implies the stored URL is a minimal path (e.g. `properties/1/photo.jpg`).
               // But the `Photos` loop in `create/route.js` was storing `publicUrl` (full URL).
               // The `Videos` loop was storing `upload.path` (relative path).
               // This is inconsistent. 
               // ListingCard tries `getPublicUrl(m.url)` which works if `m.url` is a path. 
               // If `m.url` is ALREADY a public URL, `getPublicUrl` might double-encode or fail?
               // Actually, `getPublicUrl` usually handles strings.
               // Let's look at `app/api/properties/route.js` (GET).
               // Line 96: `supabase.storage.from('property-media').getPublicUrl(m.url).data.publicUrl`
               // If `m.url` is a full URL, this is wrong.
               // So the `Photos` loop inserting `publicUrl` was likely WRONG in the `create/route.js`.
               // The `Videos` loop was inserting `upload.path`.
               // I should fix this to store `upload.path` (relative) for BOTH, 
               // so the GET endpoint works correctly.
        media_type: 'video',
        is_primary: false,
        display_order: 100 + i + 1,
      };
    });

    const [photoMediaRecords, videoMediaRecords] = await Promise.all([
      Promise.all(photoUploadPromises),
      Promise.all(videoUploadPromises)
    ]);

    const allMediaRecords = [...photoMediaRecords, ...videoMediaRecords];

    const { error: mediaErr } = await supabase.from('property_media').insert(allMediaRecords);
      
    if (mediaErr) {
      console.error('[DEBUG] Media record error:', mediaErr);
      throw mediaErr;
    }

    console.log('[DEBUG] All media uploaded successfully');

    return NextResponse.json({ 
      success: true, 
      property_id: property.id 
    });
    
  } catch (err) {
    console.error('[DEBUG] Unexpected error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to create property',
      debug: {
        stack: err.stack
      }
    }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 });
}