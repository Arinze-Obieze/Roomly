import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';

/**
 * Public endpoint to log feature events from the client side.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { featureName, action, metadata } = await request.json();

    if (!featureName || !action) {
      return NextResponse.json({ error: 'featureName and action are required' }, { status: 400 });
    }

    const success = await logFeatureEvent({
      userId: user?.id,
      featureName,
      action,
      metadata: {
        ...metadata,
        userAgent: request.headers.get('user-agent'),
        source: 'client-api',
      },
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Analytics Log API] Error:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}
