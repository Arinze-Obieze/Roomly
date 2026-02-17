'use client';

import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from './auth-context';
import { createClient } from '@/lib/supabase/client';

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
                .select('*')
                .eq('id', authUser.id)
                .single();
                
                if (profileError && profileError.code !== 'PGRST116') {
                    console.warn('Error fetching profile:', profileError.message);
                }

                if (mounted) {
                    setUser({ ...authUser, ...(profile || {}) });
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
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (mounted && profile) {
                setUser(u => ({ ...u, ...session.user, ...profile }));
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

  const refreshSession = async () => {
     const supabase = createClient();
     const { data: { user: authUser } } = await supabase.auth.getUser();
     
     if (authUser) {
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
        setUser({ ...authUser, ...profile });
     } else {
        setUser(null);
     }
  };

  const updateProfile = async (updates) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      setUser(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
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

  const signInWithGoogle = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${location.origin}/auth/callback`,
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
