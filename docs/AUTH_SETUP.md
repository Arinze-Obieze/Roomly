# Authentication Setup Guide

## Session Configuration (Critical)

For the application to support the recommended **30-day session duration**, you must configure the following setting in your Supabase Project Dashboard. This setting cannot be controlled via code.

1.  Go to your **Supabase Dashboard**.
2.  Navigate to **Authentication** > **Configuration** > **Security** (or **Sessions** depending on the dashboard version).
3.  Find the **Refresh Token Validity** setting.
4.  Set the value to **2592000** seconds (which equals 30 days).
5.  Click **Save**.

### Why this is needed

The application code handles automatic token refreshing (`autoRefreshToken: true`), but the _lifespan_ of that refresh token is dictated by the server-side configuration in Supabase. Increasing this value ensures users stay logged in for 30 days as long as they are active, providing a better user experience for a marketplace platform.
