'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/hooks/useAuth';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';

// Simplified schema for the modal
const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default function SignUpModal({ isOpen, onClose, message, onLoginClick }) {
  const router = useRouter();
  const { login, signup, signInWithGoogle, loading: authLoading } = useAuth(); // Assuming login/signup available
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
        email: '',
        password: ''
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    if (mode === 'signup') {
        const fullName = data.email.split('@')[0]; // Auto-generate name for quick signup
        const { error, requiresEmailConfirmation } = await signup(data.email, data.password, fullName);
        if (error) {
            toast.error(error);
        } else {
            toast.success('Account created! Please check email.');
            onClose();
        }
    } else {
        const { error } = await login(data.email, data.password);
        if (error) {
            toast.error(error);
        } else {
            toast.success('Logged in successfully');
            onClose();
            router.refresh(); // Refresh to update UI state
        }
    }
  };

  const handleSwitchMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup');
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">
            {mode === 'signup' ? 'SIGN UP TO CONTINUE' : 'LOG IN TO CONTINUE'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <MdClose size={24} />
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className="mb-6 bg-cyan-50 text-cyan-900 p-4 rounded-xl border border-cyan-100 text-sm font-medium">
                {message}
            </div>
          )}

          <div className="mb-6">
             <h4 className="text-lg font-bold text-slate-900 mb-1">
                {mode === 'signup' ? 'Create your free account' : 'Welcome back'}
             </h4>
             <p className="text-slate-500 text-sm">
                {mode === 'signup' 
                    ? 'Join RoomFind to access all features.' 
                    : 'Log in to continue your search.'}
             </p>
          </div>



          <button
            onClick={async () => {
              const { error } = await signInWithGoogle();
              if (error) toast.error(error.message);
            }}
            className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                    placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                    type="password"
                    {...register('password')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none"
                    placeholder="Enter password"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button 
                type="submit"
                disabled={isSubmitting || authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white font-bold rounded-xl shadow-lg shadow-terracotta-500/20 hover:shadow-terracotta-500/30 active:scale-[0.98] transition-all"
            >
                {isSubmitting || authLoading 
                    ? (mode === 'signup' ? 'Creating Account...' : 'Logging In...') 
                    : (mode === 'signup' ? 'Sign Up & Continue' : 'Log In & Continue')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
             <p className="text-slate-600 text-sm">
                {mode === 'signup' ? 'Already have an account?' : 'Don\'t have an account?'}
                <button 
                    onClick={handleSwitchMode}
                    className="ml-2 font-bold text-terracotta-500 hover:text-terracotta-600 hover:underline"
                >
                    {mode === 'signup' ? 'Log In' : 'Sign Up'}
                </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
