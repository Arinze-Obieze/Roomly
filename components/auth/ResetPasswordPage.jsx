'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordField from '../Forms/PasswordField';

import SubmitButton from '../Forms/SubmitButton';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import AuthHeader from '../Layout/AuthHeader';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.password || !formData.confirmPassword) {
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

    setIsSubmitting(true);
    const { error } = await updatePassword(formData.password);

    if (error) {
      toast.error(error);
      setIsSubmitting(false);
    } else {
      toast.success('Password updated successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader
        title="Reset your password"
        subtitle="Enter your new password below."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <PasswordField
          label="New Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          placeholder="Enter new password"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        {formData.password.length > 0 && (
          <p className="form-hint">
            Password strength: {["Weak","Fair","Good","Excellent"][Math.min(passwordStrength-1,3)] || "Too short"}
          </p>
        )}

        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          showPassword={showConfirmPassword}
          togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm new password"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <SubmitButton disabled={isSubmitting || authLoading}>
          {isSubmitting ? 'Updating Password...' : 'Update Password'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-muted">
        Remember your password?{' '}
        <a
          href="/login"
          className="link font-semibold"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
