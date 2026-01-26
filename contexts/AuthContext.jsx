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

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
    }
  }, []);

  const updateProfile = async (updates) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state immediately for better UX
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

  useEffect(() => {
    // Initial session check
    refreshSession().finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    refreshSession,
    updateProfile,
    signOut,
    openLoginModal
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
