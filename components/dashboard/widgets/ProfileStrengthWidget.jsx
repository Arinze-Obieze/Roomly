'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MdArrowForward, MdBolt, MdPerson, MdStyle, MdTune } from 'react-icons/md';
import { motion } from 'framer-motion';

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
        supabase.from('user_lifestyles').select('user_id').eq('user_id', user.id).maybeSingle(),
        supabase.from('match_preferences').select('user_id').eq('user_id', user.id).maybeSingle()
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

  if (!user || data.loading) return null;

  // Calculate Score
  const hasAvatar = user?.profile_picture || user?.avatar_url || user?.user_metadata?.avatar_url;
  const hasBio = user?.bio || user?.user_metadata?.bio;
  
  let score = 15;
  if (hasAvatar) score += 10;
  if (hasBio) score += 8;
  if (data.lifestyle) score += 33;
  if (data.preferences) score += 34;

  const isComplete = score >= 99;
  if (isComplete) return null;

  const getScoreColor = () => {
    if (score < 40) return 'bg-terracotta-500';
    if (score < 70) return 'bg-yellow-400';
    return 'bg-teal-500';
  };

  const getScoreText = () => {
    if (score < 40) return 'Needs work';
    if (score < 70) return 'Getting there';
    if (score < 99) return 'Almost done';
    return 'Complete!';
  };

  const missingItems = [];
  if (!hasAvatar) missingItems.push('photo');
  if (!hasBio) missingItems.push('bio');
  if (!data.lifestyle) missingItems.push('lifestyle');
  if (!data.preferences) missingItems.push('preferences');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-navy-100 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-terracotta-50 rounded-lg">
            <MdBolt className="text-terracotta-500" size={16} />
          </div>
          <h3 className="font-heading font-bold text-navy-950">Profile Strength</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-navy-500">{getScoreText()}</span>
          <span className={`text-sm font-heading font-bold ${isComplete ? 'text-teal-600' : 'text-navy-950'}`}>{score}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-navy-100 rounded-full mb-5 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${getScoreColor()}`}
        />
      </div>

      <div className="space-y-2">
        {!hasAvatar && (
          <button 
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-navy-200 hover:border-terracotta-200 hover:bg-terracotta-50/50 group transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-navy-100 rounded-lg group-hover:bg-white transition-colors">
                <MdPerson className="text-navy-500 group-hover:text-terracotta-500" size={16} />
              </div>
              <div>
                <div className="text-sm font-heading font-bold text-navy-950">Add profile photo</div>
                <div className="text-xs text-navy-500">+10% match accuracy</div>
              </div>
            </div>
            <MdArrowForward className="text-navy-300 group-hover:text-terracotta-500" />
          </button>
        )}

          {!hasBio && (
            <button 
              onClick={() => router.push('/profile')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-navy-200 hover:border-terracotta-200 hover:bg-terracotta-50/50 group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-navy-100 rounded-lg group-hover:bg-white transition-colors">
                  <MdPerson className="text-navy-500 group-hover:text-terracotta-500" size={16} />
                </div>
                <div>
                  <div className="text-sm font-heading font-bold text-navy-950">Add bio</div>
                  <div className="text-xs text-navy-500">+8% match accuracy</div>
                </div>
              </div>
              <MdArrowForward className="text-navy-300 group-hover:text-terracotta-500" />
            </button>
          )}

          {!data.lifestyle && (
            <button 
              onClick={() => router.push('/profile?tab=lifestyle')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-navy-200 hover:border-terracotta-200 hover:bg-terracotta-50/50 group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-navy-100 rounded-lg group-hover:bg-white transition-colors">
                  <MdStyle className="text-navy-500 group-hover:text-terracotta-500" size={16} />
                </div>
                <div>
                  <div className="text-sm font-heading font-bold text-navy-950">Complete lifestyle quiz</div>
                  <div className="text-xs text-navy-500">+33% match accuracy</div>
                </div>
              </div>
              <MdArrowForward className="text-navy-300 group-hover:text-terracotta-500" />
            </button>
          )}

          {!data.preferences && (
            <button 
              onClick={() => router.push('/profile?tab=preferences')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-navy-200 hover:border-terracotta-200 hover:bg-terracotta-50/50 group transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-navy-100 rounded-lg group-hover:bg-white transition-colors">
                  <MdTune className="text-navy-500 group-hover:text-terracotta-500" size={16} />
                </div>
                <div>
                  <div className="text-sm font-heading font-bold text-navy-950">Set roommate preferences</div>
                  <div className="text-xs text-navy-500">+34% match accuracy</div>
                </div>
              </div>
              <MdArrowForward className="text-navy-300 group-hover:text-terracotta-500" />
            </button>
          )}
      </div>
    </motion.div>
  );
}
