'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordField from './Forms/PasswordField';
import InputField from './Forms/InputField';
import CheckboxField from './Forms/CheckboxField';
import AuthHeader from './Layout/AuthHeader';
import SubmitButton from './Forms/SubmitButton';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    const pwd = formData.password;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    setPasswordStrength(score);
  }, [formData.password]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and privacy policy');
      return;
    }

    setIsSubmitting(true);
    const { error, requiresEmailConfirmation, isDuplicate } = await signup(
      formData.email, 
      formData.password, 
      formData.fullName
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
      setIsSubmitting(false);
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
        subtitle="Join 50,000+ flatmates finding their perfect home."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="Full Name"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g. Sarah Mitchell"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

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

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          placeholder="Create a password"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        {formData.password.length > 0 && (
          <p className="form-hint">
            Password strength: {["Weak","Fair","Good","Excellent"][Math.min(passwordStrength-1,3)] || "Too short"}
          </p>
        )}

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          showPassword={showConfirmPassword}
          togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm your password"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <CheckboxField
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={handleChange}
          label={
            <span>
              I agree to the{' '}
              <a href="#" className="link">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="link">
                Privacy Policy
              </a>
            </span>
          }
        />

        <SubmitButton disabled={!formData.agreeToTerms || isSubmitting || authLoading}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
