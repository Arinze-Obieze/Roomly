'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import InputField from '../forms/InputField';
import PasswordField from '../forms/PasswordField';
import AuthHeader from '../layout/AuthHeader';
import SubmitButton from '../forms/SubmitButton';
import toast from 'react-hot-toast';
import { useAuth } from '@/core/hooks/useAuth';

// Zod Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, signInWithGoogle, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    const { error } = await login(data.email, data.password);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Successfully logged in!');
      router.push('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
        toast.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader 
        title="Welcome Back"
        subtitle="Sign in to your account to continue your search."
      />

        <button
            onClick={handleGoogleSignIn}
            type="button"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <InputField
          label="Email Address"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="sarah@example.com"
        />

        <PasswordField
          label="Password"
          name="password"
          register={register}
          error={errors.password}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center h-6">
            <input
              id="rememberMe"
              type="checkbox"
              {...register('rememberMe')}
              className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-3 text-sm font-medium text-secondary cursor-pointer">
              Remember me
            </label>
          </div>
          <a href="/forgot-password" className="link link-muted text-sm">
            Forgot password?
          </a>
        </div>

        <SubmitButton disabled={isSubmitting || authLoading}>
          {isSubmitting || authLoading ? 'Signing In...' : 'Sign In'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-muted">
        Don't have an account?{' '}
        <a href="/signup" className="link font-semibold">
          Sign up
        </a>
      </p>

      <div className="mt-8 text-center">
        <p className="text-muted text-sm">
          By continuing, you agree to our{' '}
          <a href="#" className="link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="link">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}