'use client';
import { useState } from 'react';
import PasswordField from './Forms/PasswordField';
import InputField from './Forms/InputField';
import CheckboxField from './Forms/CheckboxField';
import AuthHeader from './Layout/AuthHeader';
import SubmitButton from './Forms/SubmitButton';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login data:', formData);
    // Handle login logic here
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

        <SubmitButton>
          Sign In
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