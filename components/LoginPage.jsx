'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PasswordField from './Forms/PasswordField';
import InputField from './Forms/InputField';
import CheckboxField from './Forms/CheckboxField';
import AuthHeader from './Layout/AuthHeader';
import SubmitButton from './Forms/SubmitButton';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const { error } = await login(formData.email, formData.password);

    if (error) {
      toast.error(error);
      setIsSubmitting(false);
    } else {
      toast.success('Login successful!');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthHeader 
        title="Welcome Back"
        subtitle="Sign in to your account to continue your search."
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

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          placeholder="Enter your password"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <div className="flex items-center justify-between pt-2">
          <CheckboxField
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            label="Remember me"
          />
          <a href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500 transition-colors duration-200 font-medium">
            Forgot password?
          </a>
        </div>

        <SubmitButton disabled={isSubmitting || authLoading}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-gray-600">
        Don't have an account?{' '}
        <a
          href="/signup"
          className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          Sign up
        </a>
      </p>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          By continuing, you agree to our{' '}
          <a href="#" className="text-emerald-600 hover:text-emerald-500 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-emerald-600 hover:text-emerald-500 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}