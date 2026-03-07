import { createAdminClient } from '@/core/utils/supabase/admin';
import { sendEmail } from '@/core/utils/email';

/**
 * Unified Notifier Service
 * Handles In-App, Email, and Push Notifications
 */
export const Notifier = {
  /**
   * Send a notification to a specific user across multiple channels
   */
  async send({ 
    userId, 
    type, 
    title, 
    message, 
    link = null, 
    data = {}, 
    channels = ['in-app'] 
  }) {
    const results = {};
    const adminSupabase = createAdminClient();

    // 1. In-App Notification
    if (channels.includes('in-app')) {
      const { error } = await adminSupabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link,
          data
        });
      results.inApp = !error;
      if (error) console.error('[Notifier] In-App Error:', error);
    }

    // 2. Email Notification
    if (channels.includes('email')) {
      try {
        const { data: userData } = await adminSupabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (userData?.email) {
          const emailResult = await sendEmail({
            to: userData.email,
            subject: title,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                <h2 style="color: #0f172a; margin-top: 0;">${title}</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">${message}</p>
                ${link ? `
                  <div style="margin-top: 24px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}${link}" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      View Details
                    </a>
                  </div>
                ` : ''}
              </div>
            `,
            text: message
          });
          results.email = emailResult.success;
        }
      } catch (err) {
        console.error('[Notifier] Email Error:', err);
        results.email = false;
      }
    }

    // 3. Push Notification (FCM Placeholder)
    if (channels.includes('push')) {
      results.push = await this._sendPush(userId, title, message, link, data);
    }

    return results;
  },

  /**
   * Private internal method to handle FCM push notifications
   */
  async _sendPush(userId, title, message, link, data) {
    try {
      const adminSupabase = createAdminClient();
      const { data: tokens } = await adminSupabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', userId);

      if (!tokens || tokens.length === 0) return false;

      // TODO: Implement FCM V1 API call using a service account token
      // For now, we log the intent and tokens
      console.log(`[Notifier] Simulating Push to ${tokens.length} devices for User ${userId}:`, { title, message, link });
      
      // In a real implementation, you'd use something like:
      // const fcmTokens = tokens.map(t => t.token);
      // await sendFcmMessages(fcmTokens, { title, body: message, data: { ...data, link } });
      
      return true;
    } catch (err) {
      console.error('[Notifier] Push Error:', err);
      return false;
    }
  }
};
