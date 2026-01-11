import { getSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

export async function POST(req) {
    // Only allow authenticated users (centralized)
    const supabase = await getSupabaseClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    // Debug: log user and authError
    console.log('[API] Authenticated user:', user, 'AuthError:', authError);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required: You must be logged in to publish a property.' }, { status: 401 });
    }

  const form = await req.formData();
  // Extract fields
  const requiredFields = [
    'title', 'description', 'property_type', 'price_per_month',
    'state', 'city', 'street', 'bedrooms', 'bathrooms', 'square_meters', 'available_from',
  ];
  for (const field of requiredFields) {
    if (!form.get(field)) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
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
  if (!photos || photos.length < 1) {
    return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
  }
  if (photos.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 photos allowed' }, { status: 400 });
  }
  if (videos.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 videos allowed' }, { status: 400 });
  }

  // Validate file types
  for (const file of photos) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'All photos must be images' }, { status: 400 });
    }
  }
  for (const file of videos) {
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'All videos must be videos' }, { status: 400 });
    }
  }

  // Insert property and upload files
  try {
    // 1. Insert property row
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .insert({
        title: form.get('title'),
        description: form.get('description'),
        property_type: form.get('property_type'),
        price_per_month: Number(form.get('price_per_month')),
        state: form.get('state'),
        city: form.get('city'),
        street: form.get('street'),
        bedrooms: Number(form.get('bedrooms')),
        bathrooms: Number(form.get('bathrooms')),
        square_meters: Number(form.get('square_meters')),
        available_from: form.get('available_from'),
        amenities,
        listed_by_user_id: user.id,
        is_active: true,
        status: 'available',
      })
      .select()
      .single();
    if (propErr) {
      // Detect RLS error
      if (propErr.message && propErr.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Permission denied: You must be logged in to publish a property.' }, { status: 403 });
      }
      throw propErr;
    }

    // 2. Upload media to storage and insert property_media
    const mediaRecords = [];
    // Photos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split('.').pop();
      const path = `properties/${property.id}/photo_${i + 1}.${ext}`;
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('property-media')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;
      // Insert media record
      const { error: mediaErr } = await supabase.from('property_media').insert({
        property_id: property.id,
        url: upload.path,
        media_type: 'image',
        is_primary: i === 0,
        display_order: i + 1,
      });
      if (mediaErr) throw mediaErr;
      mediaRecords.push(upload.path);
    }
    // Videos
    for (let i = 0; i < videos.length; i++) {
      const file = videos[i];
      const ext = file.name.split('.').pop();
      const path = `properties/${property.id}/video_${i + 1}.${ext}`;
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('property-media')
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { error: mediaErr } = await supabase.from('property_media').insert({
        property_id: property.id,
        url: upload.path,
        media_type: 'video',
        is_primary: false,
        display_order: 100 + i + 1,
      });
      if (mediaErr) throw mediaErr;
      mediaRecords.push(upload.path);
    }

    return NextResponse.json({ success: true, property_id: property.id });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to create property' }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
