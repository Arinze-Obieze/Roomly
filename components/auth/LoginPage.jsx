'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import InputField from '../Forms/InputField';
import PasswordField from '../Forms/PasswordField';
import AuthHeader from '../Layout/AuthHeader';
import SubmitButton from '../Forms/SubmitButton';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Zod Schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
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

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader 
        title="Welcome Back"
        subtitle="Sign in to your account to continue your search."
      />

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