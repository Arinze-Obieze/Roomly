import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { cachedFetch, getCachedInt } from '@/core/utils/redis';
import crypto from 'crypto';
import { getPeopleDiscoveryState } from '@/core/services/matching/presentation/people-discovery-state';

// Generate cache key for landlord interests
const generateCacheKey = ({ userId, interestsVersion }) => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ userId, interestsVersion }))
    .digest('hex');
  return `landlord:interests:${hash}`;
};

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interestsVersion = await getCachedInt(`v:interests:user:${user.id}`);
    const cacheKey = generateCacheKey({ userId: user.id, interestsVersion });
    const adminSb = createAdminClient();

    // Try to fetch from cache first (10 min TTL for landlord interests)
    const cachedData = await cachedFetch(cacheKey, 600, async () => {
      return await fetchLandlordInterestsFromDB(adminSb, user.id);
    });

    return NextResponse.json({ data: cachedData });

  } catch (error) {
    console.error('[Landlord Interests GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract database fetch logic
async function fetchLandlordInterestsFromDB(supabase, userId) {
  // 1. Get properties owned by the landlord
  const { data: landlordProperties } = await supabase
    .from('properties')
    .select('id')
    .eq('listed_by_user_id', userId);

  if (!landlordProperties || landlordProperties.length === 0) {
    return [];
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
        profile_visibility,
        is_verified
      )
    `)
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const seekerIds = (interests || [])
    .map((item) => item?.users?.id)
    .filter((candidateId) => candidateId && candidateId !== userId);

  const { data: acceptedPeopleInterestRows, error: acceptedPeopleInterestError } = seekerIds.length > 0
    ? await supabase
      .from('people_interests')
      .select('initiator_user_id, target_user_id')
      .eq('status', 'accepted')
      .or(
        [
          `and(initiator_user_id.eq.${userId},target_user_id.in.(${seekerIds.join(',')}))`,
          `and(target_user_id.eq.${userId},initiator_user_id.in.(${seekerIds.join(',')}))`,
        ].join(',')
      )
      .limit(1000)
    : { data: [], error: null };

  if (acceptedPeopleInterestError) throw acceptedPeopleInterestError;

  const acceptedPeopleRevealKeys = new Set(
    (acceptedPeopleInterestRows || []).flatMap((row) => {
      const initiatorId = row?.initiator_user_id;
      const targetId = row?.target_user_id;
      if (!initiatorId || !targetId) return [];
      return [
        `${initiatorId}:${targetId}`,
        `${targetId}:${initiatorId}`,
      ];
    })
  );

  // 3. Apply masking for private seekers
  const transformed = interests.map(item => {
    const seeker = item.users;
    const isAccepted = item.status === 'accepted';
    const hasAcceptedPeopleReveal = acceptedPeopleRevealKeys.has(`${userId}:${seeker?.id}`);
    const discoveryState = getPeopleDiscoveryState({
      subject: seeker,
      matchScore: typeof item.compatibility_score === 'number' ? item.compatibility_score : 100,
      minMatch: 70,
      hasMutualReveal: isAccepted || hasAcceptedPeopleReveal,
    });
    const shouldMask = discoveryState.shouldBlurProfile;

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
        isPrivateSeeker: discoveryState.isPrivateProfile,
        shouldMask,
        canContactDirectly: discoveryState.isRevealed,
        revealSource: hasAcceptedPeopleReveal ? 'people_interest' : (isAccepted ? 'property_interest' : null),
        ctaState: discoveryState.ctaState,
        ctaLabel: discoveryState.ctaLabel,
      };
    });

  return transformed;
}
