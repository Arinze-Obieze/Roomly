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

    const [{ count: scoreCount, error: scoreError }, { count: propertyCount, error: propertyError }] = await Promise.all([
      supabase
        .from('compatibility_scores')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('listed_by_user_id', user.id),
    ]);

    if (scoreError || propertyError) {
      return NextResponse.json({ hasScores: false, count: 0, expected: 0 });
    }

    const count = scoreCount ?? 0;
    const expected = propertyCount ?? 0;
    return NextResponse.json({
      hasScores: expected === 0 ? true : count >= expected,
      count,
      expected,
    });
  } catch {
    return NextResponse.json({ hasScores: false, count: 0, expected: 0 });
  }
}
