import { logActivityEvent } from '@/core/services/observability/activity-log';

export async function logSuperadminEvent(adminClient, payload) {
  await logActivityEvent({
    adminClient,
    service: 'superadmin',
    ...(payload || {}),
  });
}
