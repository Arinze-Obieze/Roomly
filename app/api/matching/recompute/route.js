/**
 * POST /api/matching/recompute
 * 
 * Recomputes and caches compatibility scores between a specific seeker
 * and all active properties (or between a specific property and all active seekers).
 * 
 * Called via internal fetch after:
 *   - A user saves their user_lifestyles or match_preferences
 *   - A landlord creates or edits a property listing
 * 
 * The DB triggers auto-DELETE stale rows. This route re-INSERTs fresh ones.
 * 
 * Auth: Must be authenticated. Can only recompute their own data.
 * Body: { mode: 'seeker' | 'property', propertyId?: string }
 *       mode='seeker'   → recompute scores for current user across all properties
 *       mode='property' → recompute scores for all seekers against one property (landlord only)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { bumpCacheVersion, invalidatePattern } from '@/core/utils/redis';
import {
  recomputeForProperty,
  recomputeForSeeker,
} from '@/core/services/matching/recompute-compatibility.service';

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
      // Bump user-scoped cache versions (no Redis KEYS scans)
      await bumpCacheVersion(`v:properties:user:${user.id}`);
      await bumpCacheVersion(`v:feed:match:user:${user.id}`);
      await bumpCacheVersion(`v:feed:recommended:user:${user.id}`);
      await invalidatePattern('landlord:find_people:*');
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
      // Bump global + property-scoped cache versions
      await bumpCacheVersion('v:properties:global');
      await bumpCacheVersion(`v:property:${propertyId}`);
      await invalidatePattern('landlord:find_people:*');
      await invalidatePattern('seeker:find_landlords:*');
      return NextResponse.json({ success: true, mode: 'property', propertyId });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('[Recompute POST] Error:', error);
    return NextResponse.json({ error: 'Failed to recompute scores' }, { status: 500 });
  }
}
