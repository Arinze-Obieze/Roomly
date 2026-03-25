import { callRedis } from '@/core/utils/redis';
import { computeRecommendedScore } from '@/core/services/matching/scoring/recommended-score';
import { canIncludePropertyInSeekerFeed } from '@/core/services/feeds/feed-eligibility';
import { comparePropertyRanking } from '@/core/services/matching/ranking/shared-order';

// Diversity logic: 
// 1. Prevent dominator hosts (max 2 consecutive from same host)
// 2. We apply a slight penalty to repeated hosts and cities to spread them out.
function applyDiversityRanking(scoredItems) {
  // Sort initially by raw score descending
  let items = [...scoredItems].sort((a, b) => comparePropertyRanking({
    id: a.propertyId,
    matchScore: a.matchScore,
    createdAt: a.property?.created_at,
    _recScore: a.score,
  }, {
    id: b.propertyId,
    matchScore: b.matchScore,
    createdAt: b.property?.created_at,
    _recScore: b.score,
  }, 'recommended'));
  
  const finalRanked = [];
  const hostCounts = {};
  
  // We want to pull the highest scored item, but if its host was seen twice in the last 5 slots, 
  // skip it and find the next best.
  while (items.length > 0) {
    let selectedIndex = 0;
    
    // Look for the best item that doesn't violate rules
    for (let i = 0; i < Math.min(items.length, 10); i++) {
      const candidate = items[i];
      const hostId = candidate.property.listed_by_user_id;
      
      // If host has 2 or more items in the immediate vicinity (last 5 items), push them down
      const recentHostCount = finalRanked.slice(-5).filter(r => r.property.listed_by_user_id === hostId).length;
      
      if (recentHostCount < 2) {
        selectedIndex = i;
        break;
      }
    }
    
    const selected = items.splice(selectedIndex, 1)[0];
    
    // Slight penalty to actual score to ensure Redis ZSET respects the diverse ordering
    // We adjust the score to guarantee it falls strictly below the previously ranked item.
    if (finalRanked.length > 0) {
      const previousScore = finalRanked[finalRanked.length - 1].finalScore;
      selected.finalScore = Math.min(selected.score, previousScore - 0.001);
    } else {
      selected.finalScore = selected.score;
    }
    
    finalRanked.push(selected);
  }
  
  return finalRanked;
}

export async function rebuildFeedsForSeeker(userId, supabase) {
  if (!userId) return false;

  // 1. Fetch scores > 50 + accepted interests so background feeds respect
  // the same visibility rules as live listing discovery.
  const [scoresRes, acceptedInterestsRes] = await Promise.all([
    supabase
      .from('compatibility_scores')
      .select(`
        property_id,
        score,
        property:properties (
          id,
          title,
          created_at,
          listed_by_user_id,
          city,
          is_active,
          approval_status,
          privacy_setting,
          property_media (id),
          host:users!listed_by_user_id (is_verified)
        )
      `)
      .eq('seeker_id', userId)
      .gt('score', 50)
      .not('property', 'is', null),
    supabase
      .from('property_interests')
      .select('property_id')
      .eq('seeker_id', userId)
      .eq('status', 'accepted')
      .limit(2000),
  ]);

  const { data: scores, error } = scoresRes;

  if (error || !scores || scores.length === 0) {
    if (error) console.error('[rebuildFeeds] DB Error:', error);
    return false;
  }

  const acceptedPropertyIds = new Set((acceptedInterestsRes.data || []).map(row => row.property_id));

  // Filter out any where property join failed (property is null)
  const validItems = scores.filter(item => {
    if (!item.property || Array.isArray(item.property)) return false;
    return canIncludePropertyInSeekerFeed({
      property: item.property,
      matchScore: item.score,
      hasAcceptedInterest: acceptedPropertyIds.has(item.property_id),
    });
  });

  if (validItems.length === 0) {
    return false;
  }

  // 2. Score and Rank
  const scoredItems = validItems.map(item => {
    return {
      propertyId: item.property_id,
      matchScore: item.score,
      recScoreRaw: computeRecommendedScore({
        score: item.score,
        created_at: item.property.created_at,
        property_media: item.property.property_media,
        host: item.property.host,
      }),
      property: item.property
    };
  });

  // Apply diversity rules to recommended
  const diversifiedRec = applyDiversityRanking(
    scoredItems.map(s => ({ ...s, score: s.recScoreRaw }))
  );

  // 3. Push to Redis using raw commands
  try {
    const recKey = `feed:recommended:${userId}`;
    const matchKey = `feed:match:${userId}`;

    // Clear old feeds
    await callRedis('DEL', recKey);
    await callRedis('DEL', matchKey);

    // ZADD recommended
    if (diversifiedRec.length > 0) {
      const recArgs = [];
      for (const item of diversifiedRec) {
        recArgs.push(item.finalScore.toString(), item.propertyId);
      }
      await callRedis('ZADD', recKey, ...recArgs);
      await callRedis('EXPIRE', recKey, '1800'); // 30 min TTL
    }

    // ZADD match (pure sort)
    if (scoredItems.length > 0) {
      const matchArgs = [];
      for (const item of scoredItems) {
        matchArgs.push(item.matchScore.toString(), item.propertyId);
      }
      await callRedis('ZADD', matchKey, ...matchArgs);
      await callRedis('EXPIRE', matchKey, '1800'); // 30 min TTL
    }

    return true;
  } catch (redisErr) {
    console.error('[rebuildFeeds] Redis Error:', redisErr);
    return false;
  }
}

// Fire-and-forget for multi-user updates (e.g. after property edit)
export async function asyncRebuildFeedsForProperty(propertyId, supabase) {
  try {
    // Get top 200 seekers with high match scores for this property to prevent massive background jobs
    const { data: scores } = await supabase
      .from('compatibility_scores')
      .select('seeker_id')
      .eq('property_id', propertyId)
      .gt('score', 50)
      .limit(200);

    if (!scores || scores.length === 0) return;

    // Process in small batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < scores.length; i += BATCH_SIZE) {
      const batch = scores.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(s => rebuildFeedsForSeeker(s.seeker_id, supabase)));
    }
  } catch (err) {
    console.error('[asyncRebuildFeedsForProperty] Failed:', err);
  }
}
