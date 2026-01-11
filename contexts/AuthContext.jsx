'use client';

import { useContext, useEffect, useState } from 'react';
import AuthContext from './auth-context';

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
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
  };

  useEffect(() => {
    // Initial session check
    refreshSession().finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
