import { createAdminClient } from '@/core/utils/supabase/admin';

/**
 * Log a feature-related event to the database.
 * Use this service in API routes for server-side logging.
 */
export async function logFeatureEvent({ userId, featureName, action, metadata = {} }) {
  try {
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from('feature_events')
      .insert({
        user_id: userId || null,
        feature_name: featureName,
        action: action,
        metadata: metadata,
      });

    if (error) {
      console.error('[logFeatureEvent] Error inserting event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[logFeatureEvent] Unexpected error:', error);
    return false;
  }
}
