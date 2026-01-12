'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileView from '@/components/profile/ProfileView';
import ProfileForm from '@/components/profile/ProfileForm';
import LifestyleWizard from '@/components/profile/LifestyleWizard';
import MatchPreferencesForm from '@/components/profile/MatchPreferencesForm';
import { MdPerson, MdStyle, MdTune, MdCheckCircle } from 'react-icons/md';

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchData = async () => {
        setFetchingData(true);
        const [lifestyleRes, prefsRes] = await Promise.all([
          supabase.from('user_lifestyles').select('*').eq('user_id', user.id).single(),
          supabase.from('match_preferences').select('*').eq('user_id', user.id).single()
        ]);
        
        setData({
          lifestyle: lifestyleRes.data,
          preferences: prefsRes.data
        });
        setFetchingData(false);
      };
      
      fetchData();
    }
  }, [user, loading, router]);

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
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const TABS = [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: <MdPerson />,
      completed: true // Basic profile is always "there" if they are logged in, effectively
    },
    { 
      id: 'lifestyle', 
      label: 'My Lifestyle', 
      icon: <MdStyle />,
      completed: !!data.lifestyle
    },
    { 
      id: 'preferences', 
      label: 'Ideal Roommate', 
      icon: <MdTune />,
      completed: !!data.preferences
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Area */}
      <ProfileHeader 
        isEditing={isEditing} 
        onToggleEdit={() => setIsEditing(!isEditing)} 
        hideEditButton={activeTab !== 'profile'}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all whitespace-nowrap relative group ${
              activeTab === tab.id 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`text-xl ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
              {tab.icon}
            </span>
            {tab.label}
            {tab.completed && (
              <span className="ml-1 text-green-500 text-lg" title="Completed">
                <MdCheckCircle />
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
      
      {/* Content Area */}
      <div className="transition-all duration-300 ease-in-out min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="animate-fadeIn">
            {isEditing ? (
              <ProfileForm onCancel={() => setIsEditing(false)} />
            ) : (
              <ProfileView />
            )}
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div className="animate-fadeIn">
            <LifestyleWizard 
              user={user} 
              initialData={data.lifestyle} 
              onComplete={refreshData}
            />
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="animate-fadeIn">
            <MatchPreferencesForm 
              user={user} 
              initialData={data.preferences} 
              onComplete={refreshData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
