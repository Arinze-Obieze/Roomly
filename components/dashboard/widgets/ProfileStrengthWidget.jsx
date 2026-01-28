
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MdCheckCircle, MdArrowForward, MdBolt } from 'react-icons/md';

export default function ProfileStrengthWidget() {
  const { user } = useAuthContext();
  const [data, setData] = useState({
    lifestyle: null,
    preferences: null,
    loading: true
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));
      const [lifestyleRes, prefsRes] = await Promise.all([
        supabase.from('user_lifestyles').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('match_preferences').select('id').eq('user_id', user.id).maybeSingle()
      ]);
      
      setData({
        lifestyle: lifestyleRes.data,
        preferences: prefsRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  if (!user || data.loading) return null; // Or skeleton

  // Calculate Score
  const hasAvatar = user?.profile_picture || user?.avatar_url || user?.user_metadata?.avatar_url;
  const hasBio = user?.bio || user?.user_metadata?.bio;
  
  // Basic Profile (33%)
  let score = 15; // Base for Email Verified
  if (hasAvatar) score += 10;
  if (hasBio) score += 8;

  // Lifestyle (33%)
  if (data.lifestyle) score += 33;
  
  // Preferences (34%)
  if (data.preferences) score += 34;

  const isComplete = score >= 99; // 99 or 100 handles rounding

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MdBolt className="text-yellow-500" />
                Profile Strength
            </h3>
            <div className="flex items-center gap-2">
               <button onClick={fetchData} className="p-1 hover:bg-slate-100 rounded-full transition-colors" title="Refresh Score">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
               </button>
               <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-slate-900'}`}>{score}%</span>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    score < 40 ? 'bg-red-400' : score < 80 ? 'bg-yellow-400' : 'bg-green-500'
                }`}
                style={{ width: `${score}%` }}
            />
        </div>

        {isComplete ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium">
                <MdCheckCircle className="text-xl shrink-0" />
                You're all set! Your profile is optimised.
            </div>
        ) : (
            <div className="space-y-3">
                {(!hasAvatar || !hasBio) && (
                     <button 
                        onClick={() => router.push('/profile')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 group transition-all text-left"
                    >
                        <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-slate-800">Complete Basic Info</div>
                            <div className="text-xs text-slate-500">
                                {(!hasAvatar && !hasBio) ? 'Add Photo & Bio' : !hasAvatar ? 'Add Profile Photo' : 'Add Bio'} (+18%)
                            </div>
                        </div>
                        <MdArrowForward className="text-slate-300 group-hover:text-slate-500" />
                    </button>
                )}

                {!data.lifestyle && (
                    <button 
                        onClick={() => router.push('/profile?tab=lifestyle')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 group transition-all text-left"
                    >
                        <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-cyan-700">Complete Lifestyle Quiz</div>
                            <div className="text-xs text-slate-500">+33% match accuracy</div>
                        </div>
                        <MdArrowForward className="text-slate-300 group-hover:text-cyan-500" />
                    </button>
                )}

                {!data.preferences && (
                     <button 
                        onClick={() => router.push('/profile?tab=preferences')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 group transition-all text-left"
                    >
                        <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">Set Ideal Roommate</div>
                            <div className="text-xs text-slate-500">+34% match accuracy</div>
                        </div>
                        <MdArrowForward className="text-slate-300 group-hover:text-indigo-500" />
                    </button>
                )}
            </div>
        )}
    </div>
  );
}
