import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

/**
 * Service for handling authentication-related business logic.
 */
export const AuthService = {
  /**
   * Logs in a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ data: import('@supabase/supabase-js').AuthResponse['data'], error: import('@supabase/supabase-js').AuthError }>}
   */
  async login(email, password) {
    const supabase = await createClient();
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  /**
   * Signs up a new user and creates their profile.
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} params.fullName
   * @param {string} [params.phone]
   * @param {string} params.redirectUrl
   * @returns {Promise<import('@supabase/supabase-js').AuthResponse['data']>}
   */
  async signup({ email, password, fullName, phone, redirectUrl }) {
    const supabase = createAdminClient();
    
    // 1. Create Auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    const userId = signUpData.user.id;

    // 2. Insert into users table via RPC
    const { error: rpcError } = await supabase.rpc('insert_user_profile', {
      p_id: userId,
      p_email: email,
      p_full_name: fullName,
      p_phone_number: phone || null,
      p_profile_picture: null,
      p_bio: null,
      p_date_of_birth: null,
      p_is_admin: false,
    });

    if (rpcError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      
      // Enhance error object for identifying duplicates
      if (rpcError.code === '23505' && rpcError.message.includes('email')) {
         const error = new Error('This email is already registered.');
         error.code = 'DUPLICATE_EMAIL';
         throw error;
      }
      
      throw new Error(`Failed to create user profile: ${rpcError.message}`);
    }

    return signUpData;
  },

  /**
   * Logs out the current user.
   * @returns {Promise<{ error: import('@supabase/supabase-js').AuthError }>}
   */
  async logout() {
    const supabase = await createClient();
    return await supabase.auth.signOut();
  },

  /**
   * Retrieves the current session and user profile.
   * @returns {Promise<Object|null>} User object with profile data or null if not authenticated.
   */
  async getSession() {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch user profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      avatar_url: profile?.profile_picture || user.user_metadata?.avatar_url,
      phone_number: profile?.phone_number,
      bio: profile?.bio,
      date_of_birth: profile?.date_of_birth,
      is_admin: profile?.is_admin,
    };
  }
};
