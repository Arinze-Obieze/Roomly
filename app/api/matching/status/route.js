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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ hasScores: false, count: 0 });

    const [{ count: scoreCount, error: scoreError }, { count: propertyCount, error: propertyError }, profileCheck] = await Promise.all([
      supabase
        .from('compatibility_scores')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('listed_by_user_id', user.id),
      supabase
        .from('user_lifestyles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    if (scoreError || propertyError) {
      return NextResponse.json({ hasScores: false, count: 0, expected: 0, missingProfile: false });
    }

    const missingProfile = profileCheck.error && profileCheck.error.code === 'PGRST116';

    const count = scoreCount ?? 0;
    const expected = propertyCount ?? 0;
    return NextResponse.json({
      // If the profile is missing, we pretend they "have scores" so the frontend doesn't
      // trigger a futile background recompute cycle. The properties API will handle 
      // the `missingProfile` state natively.
      hasScores: missingProfile ? true : (expected === 0 ? true : count >= expected),
      count,
      expected,
      missingProfile
    });
  } catch {
    return NextResponse.json({ hasScores: false, count: 0, expected: 0, missingProfile: false });
  }
}
