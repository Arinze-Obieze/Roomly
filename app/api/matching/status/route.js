/**
 * GET /api/matching/status
 * 
 * Fast check: does the current user have any cached compatibility scores?
 * Used by the dashboard to decide whether to trigger a background recompute.
 * 
 * Returns: { hasScores: boolean, count: number }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ hasScores: false, count: 0 });

    const { count, error } = await supabase
      .from('compatibility_scores')
      .select('*', { count: 'exact', head: true })
      .eq('seeker_id', user.id);

    if (error) return NextResponse.json({ hasScores: false, count: 0 });

    return NextResponse.json({ hasScores: (count ?? 0) > 0, count: count ?? 0 });
  } catch {
    return NextResponse.json({ hasScores: false, count: 0 });
  }
}
