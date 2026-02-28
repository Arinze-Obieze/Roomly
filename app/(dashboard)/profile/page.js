'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { createClient } from '@/core/utils/supabase/client';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileView from '@/components/profile/ProfileView';
import ProfileForm from '@/components/profile/ProfileForm';
import LifestyleWizard from '@/components/profile/LifestyleWizard';
import MatchPreferencesForm from '@/components/profile/MatchPreferencesForm';
import SettingsPanel from '@/components/profile/SettingsPanel';
import { MdPerson, MdStyle, MdTune, MdCheckCircle, MdSettings } from 'react-icons/md';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

export default function ProfilePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [data, setData] = useState({
    lifestyle: null,
    preferences: null
  });
  const [fetchingData, setFetchingData] = useState(true);

  const supabase = createClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fetch lifestyle + preferences data whenever user changes
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setFetchingData(true);
      try {
        const [lifestyleRes, prefsRes] = await Promise.all([
          supabase.from('user_lifestyles').select('*').eq('user_id', user.id).single(),
          supabase.from('match_preferences').select('*').eq('user_id', user.id).single()
        ]);
        setData({
          lifestyle: lifestyleRes.data ?? null,
          preferences: prefsRes.data ?? null
        });
      } catch (err) {
        console.error('[profile] fetchData error:', err);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  // Re-run only when actual user ID changes (stable across re-renders)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refreshData = async () => {
      if (!user) return;
      const [lifestyleRes, prefsRes] = await Promise.all([
        supabase.from('user_lifestyles').select('*').eq('user_id', user.id).single(),
        supabase.from('match_preferences').select('*').eq('user_id', user.id).single()
      ]);
      
      setData({
        lifestyle: lifestyleRes.data,
        preferences: prefsRes.data
      });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlobalSpinner size="md" color="primary" />
      </div>
    );
  }

  const TABS = [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: MdPerson,
      completed: true
    },
    { 
      id: 'lifestyle', 
      label: 'My Lifestyle', 
      icon: MdStyle,
      completed: !!data.lifestyle
    },
    { 
      id: 'preferences', 
      label: 'Ideal Roommate', 
      icon: MdTune,
      completed: !!data.preferences
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: MdSettings,
      completed: false
    }
  ];

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header Area */}
      <ProfileHeader 
        isEditing={isEditing} 
        onToggleEdit={() => setIsEditing(!isEditing)} 
        hideEditButton={activeTab !== 'profile'}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-navy-200 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-heading font-medium text-sm transition-all whitespace-nowrap relative group ${
              activeTab === tab.id 
                ? 'text-navy-950' 
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <tab.icon 
              size={20} 
              className={`transition-colors ${
                activeTab === tab.id ? 'text-terracotta-500' : 'text-navy-400 group-hover:text-navy-600'
              }`} 
            />
            {tab.label}
            {tab.completed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1 text-teal-500"
              >
                <MdCheckCircle size={16} />
              </motion.span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-terracotta-500 rounded-t-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <ProfileForm onCancel={() => setIsEditing(false)} />
              ) : (
                <ProfileView />
              )}
            </div>
          )}

          {activeTab === 'lifestyle' && (
            fetchingData ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-navy-100 rounded-2xl w-1/3" />
                <div className="h-40 bg-navy-50 rounded-3xl border border-navy-100" />
                <div className="h-24 bg-navy-50 rounded-3xl border border-navy-100" />
              </div>
            ) : (
              <LifestyleWizard 
                user={user} 
                initialData={data.lifestyle} 
                onComplete={refreshData}
              />
            )
          )}

          {activeTab === 'preferences' && (
            fetchingData ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-navy-100 rounded-2xl w-1/3" />
                <div className="h-40 bg-navy-50 rounded-3xl border border-navy-100" />
                <div className="h-24 bg-navy-50 rounded-3xl border border-navy-100" />
              </div>
            ) : (
              <MatchPreferencesForm 
                user={user} 
                initialData={data.preferences} 
                role={data.lifestyle?.primary_role}
                onComplete={refreshData}
              />
            )
          )}

          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}