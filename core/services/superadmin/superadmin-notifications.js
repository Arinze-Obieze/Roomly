import { Notifier } from '../notifications/notifier.js';
import { createAdminClient } from '../../utils/supabase/admin.js';

export async function notifySuperadmins({
  actorUserId = null,
  type = 'system',
  title,
  message,
  link = null,
  data = {},
  channels = ['in-app', 'email'],
}) {
  const adminSupabase = createAdminClient();
  const { data: superadmins, error } = await adminSupabase
    .from('users')
    .select('id')
    .eq('is_superadmin', true);

  if (error) {
    throw error;
  }

  const adminIds = (superadmins || [])
    .map((admin) => admin.id)
    .filter((id) => id && id !== actorUserId);

  if (adminIds.length === 0) {
    return { notified: 0, skipped: true };
  }

  const results = await Promise.allSettled(
    adminIds.map((adminId) =>
      Notifier.send({
        userId: adminId,
        type,
        title,
        message,
        link,
        data,
        channels,
      })
    )
  );

  return {
    notified: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}
