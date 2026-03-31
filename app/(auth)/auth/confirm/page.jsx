'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/core/utils/supabase/client';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { resolvePostAuthPath } from '@/core/utils/auth/post-auth-redirect';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');

  const nextPath = useMemo(() => resolvePostAuthPath(searchParams.get('next')), [searchParams]);

  useEffect(() => {
    let mounted = true;

    const completeSignup = async () => {
      try {
        const supabase = createClient();
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          router.replace(nextPath);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw userError;
        }

        if (user) {
          router.replace(nextPath);
          return;
        }

        throw new Error('Invalid or expired signup link.');
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error?.message || 'Unable to complete sign up.');
      }
    };

    completeSignup();

    return () => {
      mounted = false;
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
          onClick={() => router.push('/signup')}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
        >
          Try signup again
        </button>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          Go to login
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
