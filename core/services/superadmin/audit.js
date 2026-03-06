export async function logSuperadminEvent(adminClient, payload) {
  try {
    const {
      requestId = null,
      userId = null,
      level = 'info',
      service = 'superadmin',
      action,
      status = 'success',
      message,
      metadata = {},
      environment = process.env.NODE_ENV || 'development',
    } = payload || {};

    if (!action || !message) return;

    await adminClient.from('activity_logs').insert({
      request_id: requestId,
      user_id: userId,
      level,
      service,
      action,
      status,
      message,
      metadata,
      environment,
    });
  } catch (error) {
    console.warn('Unable to write activity log:', error?.message || error);
  }
}
