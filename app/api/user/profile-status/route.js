import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has completed user_lifestyles and match_preferences
    const [lifestyleRes, prefsRes] = await Promise.all([
      supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('match_preferences').select('user_id').eq('user_id', user.id).maybeSingle(),
    ]);

    const hasLifestyle = !!lifestyleRes.data;
    const hasPreferences = !!prefsRes.data;
    const isProfileComplete = hasLifestyle && hasPreferences;

    return NextResponse.json({
      hasLifestyle,
      hasPreferences,
      isProfileComplete
    });

  } catch (error) {
    console.error('[Profile Status GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile status' }, { status: 500 });
  }
}
