'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InputField from './Forms/InputField';
import AuthHeader from './Layout/AuthHeader';
import SubmitButton from './Forms/SubmitButton';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword, loading: authLoading } = useAuth();
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPassword(formData.email);

    if (error) {
      toast.error(error);
      setIsSubmitting(false);
    } else {
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
    }
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto lg:mx-0">
        <AuthHeader
          title="Check your email"
          subtitle="We've sent a password reset link to your email address."
        />

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mt-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-emerald-600 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong className="font-semibold text-gray-900">Email sent to:</strong>{' '}
                {formData.email}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-emerald-600 hover:text-emerald-500 font-semibold underline"
                >
                  try again
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader
        title="Forgot your password?"
        subtitle="No worries! Enter your email and we'll send you a reset link."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="sarah@example.com"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <SubmitButton disabled={isSubmitting || authLoading}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-gray-600">
        Remember your password?{' '}
        <a
          href="/login"
          className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
