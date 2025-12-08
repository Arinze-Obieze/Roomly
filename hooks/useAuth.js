// @/hooks/useAuth.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const signup = async (email, password, fullName, phone = null) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          },
          // If you want to redirect after email confirmation
          // emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      return { 
        user: data.user, 
        error: null 
      };
      
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        user: null, 
        error: error.message || 'An error occurred during signup' 
      };
    } finally {
      setLoading(false);
    }
  };

  
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Refresh the router to update authentication state
      router.refresh();
      
      return { 
        user: data.user, 
        error: null 
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        user: null, 
        error: error.message || 'Invalid email or password' 
      };
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      return { 
        error: null 
      };
      
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        error: error.message || 'Failed to send reset email' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    signup,
    login,
    logout,
    resetPassword,
    loading,
  };
};