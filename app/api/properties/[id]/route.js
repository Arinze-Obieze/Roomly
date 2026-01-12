import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Transform media URLs to public URLs
    if (property.property_media) {
      property.property_media = property.property_media.map(media => ({
        ...media,
        url: supabase.storage.from('property-media').getPublicUrl(media.url).data.publicUrl
      }));
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON (legacy/simple) and FormData (with files)
    const contentType = request.headers.get('content-type') || '';
    let updates = {};
    let existingPhotos = [];
    let newPhotos = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract text fields
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
        amenities: JSON.parse(formData.get('amenities') || '[]'),
      };

      existingPhotos = formData.getAll('existing_photos[]');
      newPhotos = formData.getAll('new_photos[]');
    } else {
      updates = await request.json();
    }

    // Verify ownership
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

    // Update property details
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle Media Sync only if using FormData (implies edit form usage)
    if (contentType.includes('multipart/form-data')) {
       // 1. Fetch current media to identify what to delete
       const { data: currentMedia } = await supabase
         .from('property_media')
         .select('*')
         .eq('property_id', id);

       // 2. Identify media to delete
       // We match existingPhotos (full URLs) against currentMedia (relative paths)
       // by checking if the URL ends with the relative path.
       const mediaToDelete = currentMedia.filter(m => {
          // Check if any "kept" photo URL contains this media's storage path
          // This is a heuristic but safe for Supabase URLs
          const isKept = existingPhotos.some(url => url.includes(m.url));
          return !isKept;
       });

       // 3. Delete removed media
       if (mediaToDelete.length > 0) {
          const pathsToRemove = mediaToDelete.map(m => m.url);
          const idsToRemove = mediaToDelete.map(m => m.id);

          // Remove from Storage
          await supabase.storage.from('property-media').remove(pathsToRemove);
          
          // Remove from DB
          await supabase.from('property_media').delete().in('id', idsToRemove);
       }

       // 4. Upload and Insert NEW media
       if (newPhotos.length > 0) {
         const newMediaRecords = [];
         
         for (const file of newPhotos) {
            const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const { error: uploadError } = await supabase.storage
              .from('property-media')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Upload error:', uploadError);
              continue;
            }

            newMediaRecords.push({
              property_id: id,
              url: fileName,
              media_type: 'image', // simplified
              is_primary: false // simplified logic
            });
         }

         if (newMediaRecords.length > 0) {
            await supabase.from('property_media').insert(newMediaRecords);
         }
       }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating property:', error);
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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
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

    // Delete property safely using RPC to handle cascading RLS
    const { error } = await supabase.rpc('delete_property', {
      p_id: id
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
