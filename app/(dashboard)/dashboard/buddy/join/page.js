'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdGroupAdd, MdKey, MdCheckCircle } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/core/contexts/AuthContext';

function BuddyJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();

  const urlToken = searchParams.get('token') || '';
  const [token, setToken] = useState(urlToken);
  const [joining, setJoining] = useState(false);

  const redirectPath = useMemo(() => {
    const query = urlToken ? `?token=${encodeURIComponent(urlToken)}` : '';
    return `/dashboard/buddy/join${query}`;
  }, [urlToken]);

  useEffect(() => {
    setToken(urlToken);
  }, [urlToken]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectPath)}`);
    }
  }, [authLoading, user, router, redirectPath]);

  const getCSRFToken = async () => {
    const res = await fetch('/api/csrf-token');
    const payload = await res.json();
    if (!res.ok || !payload?.csrfToken) {
      throw new Error('Unable to get security token. Please refresh and try again.');
    }
    return payload.csrfToken;
  };

  const joinGroup = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      toast.error('Invite token is required.');
      return;
    }

    setJoining(true);
    try {
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/buddy/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ token: trimmed }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Unexpected server response (${res.status}). ${text.slice(0, 120)}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to join group');

      toast.success(data?.alreadyMember ? 'You are already in this group.' : 'Joined group successfully!');
      router.push('/dashboard/buddy');
      router.refresh();
    } catch (error) {
      toast.error(error?.message || 'Unable to join group');
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
            <MdGroupAdd size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Join Buddy Group</h1>
            <p className="text-sm text-slate-500">Paste your invite token or open this page from your invite link.</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Invite token</label>
          <div className="relative">
            <MdKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste invite token here"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={joinGroup}
          disabled={joining || !token.trim()}
          className="mt-5 w-full bg-terracotta-600 text-white rounded-xl py-3 font-bold hover:bg-terracotta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <MdCheckCircle size={18} />
          {joining ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}

export default function BuddyJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-terracotta-500 rounded-full animate-spin" />
        </div>
      }
    >
      <BuddyJoinContent />
    </Suspense>
  );
}
