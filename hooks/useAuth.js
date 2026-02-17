// @/hooks/useAuth.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshSession, signInWithGoogle } = useAuthContext(); // ✅ Call at the top level

  const signup = async (email, password, fullName, phone = null) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate email error
        if (data.isDuplicate) {
          return { 
            user: null, 
            error: data.error,
            isDuplicate: true
          };
        }
        throw new Error(data.error || 'Signup failed');
      }

      return { 
        user: { id: data.userId }, 
        error: null,
        requiresEmailConfirmation: data.requiresEmailConfirmation,
        isDuplicate: false
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Refresh router to update server-side session state
      router.refresh();
      
      // Refresh client-side auth state
      await refreshSession();
      
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
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

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

  const updatePassword = async (newPassword) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      return { 
        error: null 
      };
      
    } catch (error) {
      console.error('Update password error:', error);
      return { 
        error: error.message || 'Failed to update password' 
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
    updatePassword,
    signInWithGoogle,
    loading,
  };
};