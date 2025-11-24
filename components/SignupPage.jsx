'use client';

import { useState, useEffect } from 'react';
import PasswordField from './Forms/PasswordField';
import InputField from './Forms/InputField';
import CheckboxField from './Forms/CheckboxField';
import AuthHeader from './Layout/AuthHeader';
import SubmitButton from './Forms/SubmitButton';
import toast from 'react-hot-toast';


export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup data:', formData);
    toast.info('Account creation logic triggered!');
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
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Strength: {["Weak","Fair","Good","Excellent"][Math.min(passwordStrength-1,3)] || "Too short"}
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
              <a href="#" className="text-emerald-600 hover:text-emerald-500 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-500 hover:underline">
                Privacy Policy
              </a>
            </span>
          }
        />

        <SubmitButton disabled={!formData.agreeToTerms}>
          Create Account
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-gray-600">
        Already have an account?{' '}
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
