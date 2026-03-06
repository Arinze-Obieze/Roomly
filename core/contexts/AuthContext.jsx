'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from './auth-context';
import { createClient } from '@/core/utils/supabase/client';

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

import SignUpModal from '@/components/modals/SignUpModal';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // 1. Check active session immediately
    const checkUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;

        if (mounted) {
           if (authUser) {
            try {
                const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*, is_superadmin')
                .eq('id', authUser.id)
                .single();
                
                if (profileError && profileError.code !== 'PGRST116') {
                    console.warn('Error fetching profile:', profileError.message);
                }

                if (mounted) {
                    const mergedUser = { ...authUser, ...(profile || {}) };
                    mergedUser.full_name = profile?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
                    mergedUser.profile_picture = profile?.profile_picture || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture;
                    mergedUser.avatar_url = mergedUser.profile_picture;
                    setUser(mergedUser);
                }
            } catch (innerError) {
                console.warn('Profile fetch failed:', innerError.message);
                if (mounted) setUser(authUser);
            }
           } else {
             setUser(null);
           }
        }
      } catch (error) {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
        console.error('Error checking auth:', error.message);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
         // Debounce or lightweight check could be here, but for now just safely set
         setUser(prev => {
             // If we already have this user and profile, don't wipe it out until we fetch profile
             if (prev?.id === session.user.id) return prev; 
             return session.user;
         });
         
         // Fetch profile in background to update
         try {
            const { data: profile } = await supabase
                .from('users')
                .select('*, is_superadmin')
                .eq('id', session.user.id)
                .single();
            
            if (mounted && profile) {
                setUser(u => {
                    const mergedUser = { ...u, ...session.user, ...profile };
                    mergedUser.full_name = profile?.full_name || session.user?.user_metadata?.full_name || session.user?.user_metadata?.name;
                    mergedUser.profile_picture = profile?.profile_picture || session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture;
                    mergedUser.avatar_url = mergedUser.profile_picture;
                    return mergedUser;
                });
            }
         } catch (e) {
             // silent fail
         }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Heartbeat for online status
  useEffect(() => {
    if (!user?.id) return;
    
    let isMounted = true;
    const supabase = createClient();
    
    const pingPresence = async () => {
      if (!isMounted) return;
      try {
        await supabase.rpc('update_last_seen');
      } catch (err) {
        // silent fail
      }
    };
    
    // Ping immediately when user becomes active
    pingPresence();
    
    // Ping every 3 minutes
    const interval = setInterval(pingPresence, 3 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  const refreshSession = async () => {
     const supabase = createClient();
     const { data: { user: authUser } } = await supabase.auth.getUser();
     
     if (authUser) {
        const { data: profile } = await supabase
            .from('users')
            .select('*, is_superadmin')
            .eq('id', authUser.id)
            .single();
        const mergedUser = { ...authUser, ...profile };
        mergedUser.full_name = profile?.full_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
        mergedUser.profile_picture = profile?.profile_picture || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture;
        mergedUser.avatar_url = mergedUser.profile_picture;
        setUser(mergedUser);
     } else {
        setUser(null);
     }
  };

  const updateProfile = async (updates) => {
    try {
      // Validate updates to prevent invalid data
      if (!updates || typeof updates !== 'object') {
        return { 
          success: false, 
          error: 'Invalid profile updates' 
        };
      }

      // Save original state for rollback
      const previousUser = { ...user };
      setUser(prev => ({ ...prev, ...updates }));

      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.success) {
        setUser(previousUser);
        return {
          success: false,
          error: payload?.error || 'Failed to update profile. Please try again.',
          details: payload,
        };
      }

      const mergedUser = { ...previousUser, ...(payload?.data || {}), ...updates };
      setUser(mergedUser);
      return { success: true };
    } catch (error) {
      // Rollback on unexpected error
      setUser(user);
      console.error('Unexpected error updating profile:', error);
      return { 
        success: false, 
        error: 'Failed to update profile. Please try again.',
        details: error
      };
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  };

  const openLoginModal = (message = '') => {
    setLoginMessage(message);
    setShowLoginModal(true);
  };

  const signInWithGoogle = async (options = {}) => {
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
        (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectTo = options?.redirectTo || `${siteUrl}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    loading,
    refreshSession,
    updateProfile,
    signOut,
    logout: signOut, // Alias for clarity
    openLoginModal,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignUpModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message={loginMessage} 
      />
    </AuthContext.Provider>
  );
}
