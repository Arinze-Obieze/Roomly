import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { buildConversationMatchContext } from '@/core/services/matching/presentation/conversation-match-context';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const { data: conversation, error: conversationError } = await adminSupabase
      .from('conversations')
      .select('id, property_id, tenant_id, host_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.tenant_id !== user.id && conversation.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const viewerRole = conversation.host_id === user.id ? 'host' : 'seeker';

    const [
      propertyRes,
      seekerLifestyleRes,
      seekerPrefsRes,
      hostLifestyleRes,
      matchScoreRes,
    ] = await Promise.all([
      adminSupabase
        .from('properties')
        .select('id, title, city, state, price_per_month, offering_type')
        .eq('id', conversation.property_id)
        .maybeSingle(),
      adminSupabase
        .from('user_lifestyles')
        .select('user_id, schedule_type, cleanliness_level, social_level, noise_tolerance, interests, overnight_guests, occupation, current_city')
        .eq('user_id', conversation.tenant_id)
        .maybeSingle(),
      adminSupabase
        .from('match_preferences')
        .select('user_id, budget_min, budget_max, location_areas')
        .eq('user_id', conversation.tenant_id)
        .maybeSingle(),
      adminSupabase
        .from('user_lifestyles')
        .select('user_id, schedule_type, cleanliness_level, social_level, noise_tolerance, interests, overnight_guests, occupation, current_city')
        .eq('user_id', conversation.host_id)
        .maybeSingle(),
      adminSupabase
        .from('compatibility_scores')
        .select('score')
        .eq('property_id', conversation.property_id)
        .eq('seeker_id', conversation.tenant_id)
        .maybeSingle(),
    ]);

    const context = buildConversationMatchContext({
      viewerRole,
      property: propertyRes.data || {},
      matchScore: matchScoreRes.data?.score ?? null,
      seekerLifestyle: seekerLifestyleRes.data || null,
      seekerPrefs: seekerPrefsRes.data || null,
      hostLifestyle: hostLifestyleRes.data || null,
    });

    return NextResponse.json({
      success: true,
      context,
    });
  } catch (error) {
    console.error('[Conversation Context GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load conversation context' }, { status: 500 });
  }
}
