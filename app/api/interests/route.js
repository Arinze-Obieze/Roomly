import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { bumpCacheVersion } from '@/core/utils/redis';
import { Notifier } from '@/core/services/notifications/notifier';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 200)));

    // Since PostgREST doesn't support a single query for both perspectives easily with inner joins 
    // without knowing if the user is a host or seeker, we do two parallel queries:
    // 1. Interests sent BY the user (Seeker view)
    // 2. Interests received FOR the user's properties (Host view)

    const [sentRes, receivedRes] = await Promise.all([
      // Sent Interests
      supabase
        .from('property_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          created_at,
          updated_at,
          property:properties!property_interests_property_id_fkey(
            id,
            title,
            city,
            state,
            price_per_month,
            is_active,
            privacy_setting,
            is_public
          )
        `)
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1),

      // Received Interests
      // This query finds properties owned by the user, and nests the incoming interests.
      // Easiest is to select interests where property.listed_by_user_id = user.id
      supabase
        .from('property_interests')
        .select(`
          id,
          status,
          compatibility_score,
          message,
          created_at,
          updated_at,
          property_id,
          seeker:users!property_interests_seeker_id_fkey(
            id,
            full_name,
            profile_picture,
            gender,
            occupation
          ),
          property:properties!inner(
            id,
            title,
            listed_by_user_id
          )
        `)
        // In Supabase, you can filter on joined tables:
        .eq('property.listed_by_user_id', user.id)
        .order('created_at', { ascending: false })
        .range(0, limit - 1)
    ]);

    return NextResponse.json({
      sent: sentRes.data || [],
      received: receivedRes.data || [],
    });
  } catch (error) {
    console.error('[GET Interests] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interestId, status } = await request.json();

    if (!interestId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Verify the user owns the property this interest is for
    const { data: interestData, error: fetchError } = await supabase
      .from('property_interests')
      .select(`
        id,
        seeker_id,
        property_id,
        status,
        property:properties!property_interests_property_id_fkey(
          id,
          title,
          listed_by_user_id
        )
      `)
      .eq('id', interestId)
      .single();

    if (fetchError || !interestData) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
    }

    if (interestData.property?.listed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this interest' }, { status: 403 });
    }

    if (interestData.status === status) {
      return NextResponse.json({ success: true, interest: interestData });
    }

    // 2. Perform the update
    const { data: updatedInterest, error: updateError } = await supabase
      .from('property_interests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', interestId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 3. Cache bumps
    await bumpCacheVersion(`v:interests:seeker:${interestData.seeker_id}`);
    await bumpCacheVersion(`v:interests:landlord:${user.id}`);
    await bumpCacheVersion(`v:properties:user:${interestData.seeker_id}`); // affects blur state for seeker

    // 4. Send notification to the seeker
    if (status === 'accepted' || status === 'declined') {
      try {
        const accepted = status === 'accepted';
        await Notifier.send({
          userId: interestData.seeker_id,
          type: 'system',
          title: accepted ? 'Interest Accepted!' : 'Interest Update',
          message: accepted
            ? `The host accepted your interest for "${interestData.property.title}". You can now chat!`
            : `The host declined your interest for "${interestData.property.title}".`,
          link: accepted
            ? `/messages?user=${user.id}&propertyId=${interestData.property_id}`
            : '/interests',
          data: { propertyId: interestData.property_id, hostId: user.id, status },
          channels: ['in-app', 'email']
        });
      } catch (nErr) {
        console.error('[Interest Patch Notify Error]', nErr);
      }
    }

    return NextResponse.json({ success: true, interest: updatedInterest });

  } catch (error) {
    console.error('[PATCH Interests] Error:', error);
    return NextResponse.json({ error: 'Failed to update interest status' }, { status: 500 });
  }
}
