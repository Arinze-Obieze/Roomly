'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/core/utils/supabase/client';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { resolvePostAuthPath } from '@/core/utils/auth/post-auth-redirect';

const SESSION_TIMEOUT_MS = 20000;

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), SESSION_TIMEOUT_MS);
    }),
  ]);
}

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  const nextPath = useMemo(() => resolvePostAuthPath(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const redirectToNext = () => {
      if (!mounted) return;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      window.location.replace(nextPath);
    };

    const pollForSession = async (attempts = 6, delayMs = 1500) => {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          redirectToNext();
          return true;
        }

        if (attempt < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      return false;
    };

    const completeSignup = async () => {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const emailFromHash = hashParams.get('email');

        if (emailFromHash) {
          setEmail(emailFromHash);
        }

        if (accessToken && refreshToken) {
          let sessionResult;

          try {
            sessionResult = await withTimeout(
              supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              }),
              'Timed out while establishing your session. Please try the link again.'
            );
          } catch (error) {
            const recovered = await pollForSession();
            if (recovered) return;
            throw error;
          }

          const { error } = sessionResult;

          if (error) {
            throw error;
          }

          const {
            data: { user },
            error: userError,
          } = await withTimeout(
            supabase.auth.getUser(),
            'Timed out while verifying your account. Please try the link again.'
          );

          if (userError) {
            throw userError;
          }

          if (!user) {
            throw new Error('We could not verify your account from this signup link.');
          }

          redirectToNext();
          return;
        }

        const { data: { user }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          'Timed out while verifying your signup link. Please try again.'
        );
        if (userError) {
          throw userError;
        }

        if (user) {
          redirectToNext();
          return;
        }

        throw new Error('Invalid or expired signup link.');
      } catch (error) {
        const recovered = await pollForSession(3, 1000);
        if (recovered || !mounted) return;
        if (!mounted) return;
        setErrorMessage(error?.message || 'Unable to complete sign up.');
      }
    };

    completeSignup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        redirectToNext();
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [nextPath, router]);

  if (!errorMessage) {
    return (
      <div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col items-center justify-center min-h-[360px] gap-4">
        <GlobalSpinner size="lg" color="primary" />
        <p className="text-sm text-slate-600">Completing your sign up...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 bg-white border border-slate-200 rounded-2xl p-6">
      <h1 className="text-xl font-bold text-slate-900">Signup link error</h1>
      <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              email
                ? `/login?email=${encodeURIComponent(email)}`
                : '/login'
            )
          }
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Go to login
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(
              email
                ? `/auth/auth-code-error?email=${encodeURIComponent(email)}`
                : '/auth/auth-code-error'
            )
          }
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          Resend confirmation
        </button>
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col items-center justify-center min-h-[360px] gap-4"><GlobalSpinner size="lg" color="primary" /></div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}
