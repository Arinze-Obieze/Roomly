import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const priceRange = searchParams.get('priceRange');
    const bedrooms = searchParams.get('bedrooms')?.split(',').map(Number).filter(Boolean);
    const propertyType = searchParams.get('propertyType');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean);
    const minBedrooms = parseInt(searchParams.get('minBedrooms'));
    const minBathrooms = parseInt(searchParams.get('minBathrooms'));
    const location = searchParams.get('location');

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
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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

    if (propertyType && propertyType !== 'any' && propertyType !== 'studio') {
      query = query.eq('property_type', propertyType);
    }

    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%,street.ilike.%${location}%`);
    }

    if (amenities && amenities.length > 0) {
      query = query.contains('amenities', amenities);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const queryStart = Date.now();
    const { data, error, count } = await query;
    console.log(`[PERF_DEBUG] DB Query Time: ${Date.now() - queryStart}ms`);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      );
    }

    const authStart = Date.now();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[PERF_DEBUG] Auth getUser Time: ${Date.now() - authStart}ms`);

    // Fetch interests for the current user to check for mutual unlocks
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
      
      // Basic masking for unauthenticated or private
      if (!user && hostName !== 'Unknown') {
        hostName = hostName.split(' ')[0];
      }

      if (shouldMask) {
          // Privacy Masking Logic
          const nameParts = hostName.split(' ');
          const maskedName = nameParts.length > 1 
            ? `${nameParts[0]} ${nameParts[1][0]}.` 
            : hostName;

          return {
            id: property.id,
            title: `Room in ${property.city}`,
            location: `${property.city}, ${property.state}`,
            price: `€${Math.floor(property.price_per_month / 100) * 100}-${Math.ceil(property.price_per_month / 100) * 100}`,
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
      price: `€${property.price_per_month}`,
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
    }});

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        hasMore: (page * pageSize) < (count || 0)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    console.log('[DEBUG] Starting property creation request');
    
    const supabase = await createClient();
    console.log('[DEBUG] Supabase client created');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[DEBUG] Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message 
    });
    
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

    let amenities = [];
    try {
      amenities = JSON.parse(form.get('amenities') || '[]');
    } catch {
      amenities = [];
    }

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

      return {
        property_id: property.id,
        url: upload.path,
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

      return {
        property_id: property.id,
        url: upload.path,
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