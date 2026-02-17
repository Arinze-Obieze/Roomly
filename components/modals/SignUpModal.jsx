'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';

// Simplified schema for the modal
const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default function SignUpModal({ isOpen, onClose, message, onLoginClick }) {
  const router = useRouter();
  const { login, signup, loading: authLoading } = useAuth(); // Assuming login/signup available
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
