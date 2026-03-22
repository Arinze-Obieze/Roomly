import { callRedis } from '@/core/utils/redis';

// Compute the recommended score for a specific property match
function calculateRecommendedScore(matchScore, property) {
  // 1. Match component (70%)
  const matchComponent = matchScore * 0.70;

  // 2. Freshness component (20%)
  // Decays from 100 to 0 over 30 days. Fast drop-off initially.
  const ageDays = (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const freshnessBase = Math.max(0, 100 * Math.exp(-ageDays / 7)); // 7-day half-life roughly
  const freshnessComponent = freshnessBase * 0.20;

  // 3. Quality component (10%)
  // Photos present = 50 pts, Verified host = 50 pts
  const hasPhotos = property.property_media && property.property_media.length > 0;
  const isVerifiedHost = property.host?.is_verified;
  const qualityBase = (hasPhotos ? 50 : 0) + (isVerifiedHost ? 50 : 0);
  const qualityComponent = qualityBase * 0.10;

  return matchComponent + freshnessComponent + qualityComponent;
}

// Diversity logic: 
// 1. Prevent dominator hosts (max 2 consecutive from same host)
// 2. We apply a slight penalty to repeated hosts and cities to spread them out.
function applyDiversityRanking(scoredItems) {
  // Sort initially by raw score descending
  let items = [...scoredItems].sort((a, b) => b.score - a.score);
  
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

  // 1. Fetch scores > 50 + properties
  const { data: scores, error } = await supabase
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
        property_media (id),
        host:users!properties_listed_by_user_id_fkey (is_verified)
      )
    `)
    .eq('seeker_id', userId)
    .gt('score', 50)
    .not('property', 'is', null);

  if (error || !scores || scores.length === 0) {
    if (error) console.error('[rebuildFeeds] DB Error:', error);
    return false;
  }

  // Filter out any where property join failed (property is null)
  const validItems = scores.filter(s => s.property && !Array.isArray(s.property));

  // 2. Score and Rank
  const scoredItems = validItems.map(item => {
    return {
      propertyId: item.property_id,
      matchScore: item.score,
      recScoreRaw: calculateRecommendedScore(item.score, item.property),
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
