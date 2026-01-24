'use client';

import { useState, useEffect } from 'react';
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
  const { signup, loading: authLoading } = useAuth();
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
                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
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
