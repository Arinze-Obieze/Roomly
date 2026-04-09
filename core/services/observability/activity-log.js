import { createAdminClient } from '@/core/utils/supabase/admin';
import { getRequestId } from '@/core/services/observability/request-id';

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch {
    return {};
  }
}

export async function logActivityEvent(payload = {}) {
  try {
    const {
      adminClient = createAdminClient(),
      request = null,
      requestId = null,
      userId = null,
      level = 'info',
      service = 'app',
      action,
      status = 'success',
      message,
      metadata = {},
      environment = process.env.NODE_ENV || 'development',
    } = payload;

    if (!action || !message) return false;

    const resolvedRequestId = requestId || getRequestId(request);

    const { error } = await adminClient.from('activity_logs').insert({
      request_id: resolvedRequestId,
      user_id: userId,
      level,
      service,
      action,
      status,
      message,
      metadata: sanitizeMetadata(metadata),
      environment,
    });

    if (error) {
      console.warn('Unable to write activity log:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Unable to write activity log:', error?.message || error);
    return false;
  }
}
