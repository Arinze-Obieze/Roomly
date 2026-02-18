'use client';

import { useState, useEffect } from 'react';
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
const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and privacy policy' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const router = useRouter();
  const { signup, signInWithGoogle, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const passwordValue = watch('password', '');

  useEffect(() => {
    let score = 0;
    const pwd = passwordValue;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    setPasswordStrength(score);
  }, [passwordValue]);

  const onSubmit = async (data) => {
    const { error, requiresEmailConfirmation, isDuplicate } = await signup(
      data.email, 
      data.password, 
      data.fullName
    );

    if (error) {
      if (isDuplicate) {
        toast.error(
          <div>
            <p className="font-semibold">{error}</p>
            <button 
              onClick={() => {
                toast.dismiss();
                router.push('/forgot-password');
              }}
              className="mt-2 text-sm link"
            >
              Reset your password →
            </button>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error);
      }
    } else {
      if (requiresEmailConfirmation) {
        toast.success('Account created! Please check your email to confirm.');
      } else {
        toast.success('Account created successfully!');
      }
      router.push('/login');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader
        title="Create your account"
        subtitle="Join the community of verified roommates."
      />

        <button
            onClick={async () => {
                const { error } = await signInWithGoogle();
                if (error) toast.error(error.message);
            }}
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
            Sign up with Google
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
          label="Full Name"
          name="fullName"
          type="text"
          register={register}
          error={errors.fullName}
          placeholder="e.g. Sarah Mitchell"
        />

        <InputField
          label="Email Address"
          name="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="sarah@example.com"
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            register={register}
            error={errors.password}
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
            placeholder="Create a password"
          />
          {passwordValue.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    passwordStrength <= 1 ? 'bg-red-500 w-1/4' :
                    passwordStrength === 2 ? 'bg-orange-500 w-2/4' :
                    passwordStrength === 3 ? 'bg-yellow-500 w-3/4' :
                    'bg-green-500 w-full'
                  }`} 
                />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {["Weak","Fair","Good","Excellent"][Math.min(passwordStrength-1,3)] || "Too short"}
              </span>
            </div>
          )}
        </div>

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          register={register}
          error={errors.confirmPassword}
          showPassword={showConfirmPassword}
          togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm your password"
        />

        <div className="flex items-start pt-2">
            <div className="flex items-center h-6">
            <input
                id="agreeToTerms"
                type="checkbox"
                {...register('agreeToTerms')}
                className="w-5 h-5 text-terracotta-600 border-slate-300 rounded focus:ring-terracotta-500 focus:ring-2 cursor-pointer"
            />
            </div>
            <div className="ml-3 text-sm">
            <label htmlFor="agreeToTerms" className="font-medium text-secondary cursor-pointer">
                I agree to the{' '}
                <a href="#" className="link">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="link">Privacy Policy</a>
            </label>
            {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}
            </div>
        </div>

        <SubmitButton disabled={isSubmitting || authLoading}>
          {isSubmitting || authLoading ? 'Creating Account...' : 'Create Account'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-muted">
        Already have an account?{' '}
        <a
          href="/login"
          className="text-emerald-500 text-sm font-semibold"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
