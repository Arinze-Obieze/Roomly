/**
 * POST /api/matching/recompute
 * 
 * Recomputes and refreshes compatibility-score-backed cache versions between a specific seeker
 * and all approved active properties (or between a specific property and all eligible seekers).
 * 
 * Called via internal fetch after:
 *   - A user saves their user_lifestyles or match_preferences
 *   - A landlord creates or edits a property listing
 * 
 * The recompute service now prunes stale rows and re-INSERTs fresh ones.
 * 
 * Auth: Must be authenticated. Can only recompute their own data.
 * Body: { mode: 'seeker' | 'property', propertyId?: string }
 *       mode='seeker'   → recompute scores for current user across all properties
 *       mode='property' → recompute scores for all seekers against one property (landlord only)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { bumpCacheVersion } from '@/core/utils/redis';
import {
  recomputeForProperty,
  recomputeForSeeker,
} from '@/core/services/matching/recompute-compatibility.service';
import { rebuildFeedsForSeeker, asyncRebuildFeedsForProperty } from '@/core/services/feeds/rebuild-feed.service';
import {
  upsertPropertyMatchingSnapshot,
  upsertUserMatchingSnapshot,
} from '@/core/services/matching/features/snapshot.service';
import {
  asyncRebuildFindPeopleShortlistsForProperty,
  rebuildHostFindPeopleShortlist,
  rebuildSeekerFindLandlordsShortlist,
} from '@/core/services/matching/precompute/find-people-shortlist';
import {
  getPropertyRecomputeVersionKeys,
  getSeekerRecomputeVersionKeys,
} from '@/core/services/matching/matching-cache-versions';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'seeker';
    const adminSb = createAdminClient();

    if (mode === 'seeker') {
      await recomputeForSeeker(adminSb, user.id);
      await Promise.all([
        upsertUserMatchingSnapshot(adminSb, user.id),
        rebuildFeedsForSeeker(user.id, adminSb),
        rebuildSeekerFindLandlordsShortlist(adminSb, user.id),
        rebuildHostFindPeopleShortlist(adminSb, user.id),
      ]);
      await Promise.all(
        getSeekerRecomputeVersionKeys(user.id).map((key) => bumpCacheVersion(key))
      );
      return NextResponse.json({ success: true, mode: 'seeker', userId: user.id });
    }

    if (mode === 'property') {
      const { propertyId } = body;
      if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

      const { data: prop } = await supabase
        .from('properties')
        .select('id, listed_by_user_id')
        .eq('id', propertyId)
        .single();

      if (!prop || prop.listed_by_user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await recomputeForProperty(adminSb, propertyId);
      await Promise.all([
        upsertPropertyMatchingSnapshot(adminSb, propertyId),
        asyncRebuildFeedsForProperty(propertyId, adminSb),
        asyncRebuildFindPeopleShortlistsForProperty(propertyId, adminSb),
      ]);
      await Promise.all(
        getPropertyRecomputeVersionKeys({
          propertyId,
          ownerUserId: user.id,
        }).map((key) => bumpCacheVersion(key))
      );
      return NextResponse.json({ success: true, mode: 'property', propertyId });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('[Recompute POST] Error:', error);
    return NextResponse.json({ error: 'Failed to recompute scores' }, { status: 500 });
  }
}
