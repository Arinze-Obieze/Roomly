'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const sanitizeNextPath = (value) => {
  if (!value || typeof value !== 'string') return '/dashboard';
  if (!value.startsWith('/')) return '/dashboard';
  if (value.startsWith('//')) return '/dashboard';
  return value;
};

export default function AuthCodeErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recovering, setRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get('next')), [searchParams]);
  const message = searchParams.get('message') || 'This confirmation link is invalid, expired, or could not be processed.';

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasTokenHash = window.location.hash.includes('access_token=');
    if (!hasTokenHash) return;

    setRecovering(true);
    window.location.replace(`/auth/confirm?next=${encodeURIComponent(nextPath)}${window.location.hash}`);
  }, [nextPath]);

  const resendConfirmation = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to resend confirmation email.');
      }

      toast.success(
        data?.message || 'If your account needs confirmation, a new link has been sent.'
      );
    } catch (error) {
      toast.error(error?.message || 'Unable to resend confirmation email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 bg-white border border-slate-200 rounded-2xl p-6">
      <h1 className="text-xl font-bold text-slate-900">Authentication failed</h1>
      <p className="mt-2 text-sm text-slate-600">{recovering ? 'Recovering your link...' : message}</p>

      {!recovering && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="resendEmail" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Resend Confirmation Link
            </label>
            <div className="flex gap-2">
              <input
                id="resendEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending...' : 'Resend'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              Back to login
            </button>
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Create account again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
