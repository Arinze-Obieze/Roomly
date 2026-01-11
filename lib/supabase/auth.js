// lib/supabase/auth.js
import { createClient } from './server';

/**
 * Get Supabase client for server-side routes
 * Use this in API routes
 */
export async function getSupabaseClient() {
  return await createClient();
}

/**
 * Get authenticated user from the current session
 * Returns { user, error }
 */
export async function getAuthenticatedUser(supabase) {
  if (!supabase) {
    supabase = await createClient();
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { user: null, error: error || new Error('Not authenticated') };
  }
  
  return { user, error: null };
}

/**
 * Require authentication for API routes
 * Returns user or throws error
 */
export async function requireAuth() {
  const supabase = await createClient();
  const { user, error } = await getAuthenticatedUser(supabase);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return { user, supabase };
}