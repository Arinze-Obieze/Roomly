import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get properties owned by the landlord
    const { data: landlordProperties } = await supabase
      .from('properties')
      .select('id')
      .eq('listed_by_user_id', user.id);

    if (!landlordProperties || landlordProperties.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const propertyIds = landlordProperties.map(p => p.id);

    // 2. Get interests for these properties
    const { data: interests, error } = await supabase
      .from('property_interests')
      .select(`
        *,
        properties (
          id,
          title,
          city
        ),
        users!seeker_id (
          id,
          full_name,
          profile_picture,
          bio,
          privacy_setting,
          is_verified
        )
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 3. Apply masking for private seekers
    const transformed = interests.map(item => {
      const seeker = item.users;
      const isAccepted = item.status === 'accepted';
      const isPrivate = seeker.privacy_setting === 'private';
      const shouldMask = isPrivate && !isAccepted;

      let seekerData = { ...seeker };

      if (shouldMask) {
        // Mask Seeker Details
        const nameParts = seeker.full_name?.split(' ') || ['User'];
        seekerData.full_name = nameParts.length > 1 
          ? `${nameParts[0]} ${nameParts[1][0]}.` 
          : seeker.full_name;
        
        seekerData.bio = seeker.bio ? seeker.bio.substring(0, 50) + '...' : null;
        seekerData.isBlurry = true;
        // Optionally mask profile picture URL or handle blur on frontend
      }

      return {
        id: item.id,
        status: item.status,
        createdAt: item.created_at,
        property: item.properties,
        seeker: seekerData,
        isPrivateSeeker: isPrivate,
        shouldMask
      };
    });

    return NextResponse.json({ data: transformed });

  } catch (error) {
    console.error('Error fetching landlord interests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
