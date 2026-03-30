import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { logFeatureEvent } from '@/core/services/analytics/analytics.service';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { assertRateLimit, buildRateLimitHeaders } from '@/core/utils/rate-limit';

/**
 * Authenticated endpoint to log feature events from the client side.
 */
export async function POST(request) {
  try {
    const csrfValidation = await validateCSRFRequest(request);
    if (!csrfValidation.valid) {
      return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await assertRateLimit({
      request,
      key: 'analytics-log',
      limit: 120,
      windowSeconds: 60,
      scope: user.id,
    });

    if (!rateLimit.allowed) {
      const headers = buildRateLimitHeaders({ limit: 120, ...rateLimit });
      return NextResponse.json(
        {
          error: rateLimit.reason === 'backend_unavailable'
            ? 'Analytics logging is temporarily unavailable.'
            : 'Too many analytics events. Please slow down.',
        },
        {
          status: rateLimit.reason === 'backend_unavailable' ? 503 : 429,
          headers,
        }
      );
    }

    const { featureName, action, metadata } = await request.json();

    if (!featureName || !action) {
      return NextResponse.json({ error: 'featureName and action are required' }, { status: 400 });
    }

    const sanitizedMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? JSON.parse(JSON.stringify(metadata))
        : {};

    if (JSON.stringify(sanitizedMetadata).length > 4000) {
      return NextResponse.json({ error: 'metadata is too large' }, { status: 400 });
    }

    const success = await logFeatureEvent({
      userId: user.id,
      featureName,
      action,
      metadata: {
        ...sanitizedMetadata,
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
