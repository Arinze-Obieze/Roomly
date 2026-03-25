/**
 * GET /api/matching/status
 * 
 * Fast check: does the current user have any cached compatibility scores?
 * Used by the dashboard to decide whether to trigger a background recompute.
 * 
 * Returns: { hasScores: boolean, count: number, expected: number }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { resolveMatchingStatus } from '@/core/services/matching/matching-status';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ hasScores: false, count: 0 });

    const [
      { count: scoreCount, error: scoreError },
      { count: propertyCount, error: propertyError },
      lifestyleCheck,
      preferencesCheck,
    ] = await Promise.all([
      supabase
        .from('compatibility_scores')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .neq('listed_by_user_id', user.id),
      supabase
        .from('user_lifestyles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('match_preferences')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    return NextResponse.json(resolveMatchingStatus({
      scoreCount,
      propertyCount,
      hasLifestyle: !!lifestyleCheck.data,
      hasPreferences: !!preferencesCheck.data,
      hasScoreError: !!scoreError,
      hasPropertyError: !!propertyError,
    }));
  } catch {
    return NextResponse.json({ hasScores: false, count: 0, expected: 0, missingProfile: false });
  }
}
