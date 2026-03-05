'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdPeopleAlt, MdRefresh, MdHomeWork, MdLocationOn } from 'react-icons/md';
import { useAuthContext } from '@/core/contexts/AuthContext';
import toast from 'react-hot-toast';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { MdLock } from 'react-icons/md';

export default function FindPeoplePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'buddies'
  const [loadingState, setLoadingState] = useState(true);
  const [profileStatus, setProfileStatus] = useState(null);
  const [featureState, setFeatureState] = useState({
    canUseFeature: true,
    message: '',
    listingCount: 0,
    minMatch: 70,
    data: [],
  });
  const [contactingId, setContactingId] = useState(null);

  const fetchMatches = async () => {
    setLoadingState(true);
    try {
      // 1. Check profile complete gate first
      const statusRes = await fetch('/api/user/profile-status');
      if (!statusRes.ok) throw new Error('Failed to verify profile status');
      const status = await statusRes.json();
      setProfileStatus(status);

      if (!status.isProfileComplete) {
        setLoadingState(false);
        return; // Halt: Show gate UI
      }

      // 2. Profile is complete, fetch matches based on active tab
      const endpoint = activeTab === 'tenants' 
        ? '/api/landlord/find-people?minMatch=70&limit=24'
        : '/api/seeker/find-buddies?minMatch=70&limit=24';
        
      const res = await fetch(endpoint);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load matches');
      setFeatureState(payload);
    } catch (error) {
      toast.error(error.message || 'Failed to load matches');
    } finally {
      setLoadingState(false);
    }
  };

  const getCSRFToken = async () => {
    const res = await fetch('/api/csrf-token');
    const payload = await res.json();
    if (!res.ok || !payload?.csrfToken) {
      throw new Error(payload?.error || 'Failed to get CSRF token');
    }
    return payload.csrfToken;
  };

  const handleContactSeeker = async (seeker) => {
    if (!seeker?.user_id || !seeker?.matched_property?.id || contactingId) return;

    setContactingId(seeker.user_id);
    try {
      const csrfToken = await getCSRFToken();
      const introMessage = `Hi ${seeker.full_name?.split(' ')[0] || ''}, I saw your ${seeker.match_score}% match for my listing "${seeker.matched_property.title}". Let me know if you'd like to discuss next steps.`;

      const res = await fetch('/api/messages/start-seeker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          seekerId: seeker.user_id,
          propertyId: seeker.matched_property.id,
          message: introMessage,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to contact seeker');

      toast.success('Message sent');
      router.push('/messages');
    } catch (error) {
      toast.error(error.message || 'Failed to contact seeker');
    } finally {
      setContactingId(null);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchMatches();
    }
  }, [user, loading, router, activeTab]); // Re-fetch when tab changes

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlobalSpinner size="md" color="slate" />
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
      <div className="mb-0 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-navy-950">Find People</h1>
          <p className="text-slate-500 mt-1">
            {activeTab === 'tenants' 
              ? `Browse seekers with ${featureState.minMatch || 70}%+ compatibility for your listings.`
              : `Find potential roommates with ${featureState.minMatch || 70}%+ lifestyle compatibility.`}
          </p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loadingState}
          className="shrink-0 bg-white border border-navy-200 px-4 py-2.5 rounded-xl text-sm font-heading font-semibold hover:bg-navy-50 transition-colors flex items-center gap-2 disabled:opacity-60 text-navy-600"
        >
          <MdRefresh />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-200 mb-8 pt-6">
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 px-4 text-sm font-heading font-bold border-b-2 transition-colors ${
            activeTab === 'tenants' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-navy-500 hover:text-navy-700'
          }`}
        >
          Find Tenants
        </button>
        <button 
          onClick={() => setActiveTab('buddies')}
          className={`pb-3 px-4 text-sm font-heading font-bold border-b-2 transition-colors ${
            activeTab === 'buddies' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-navy-500 hover:text-navy-700'
          }`}
        >
          Find Buddies
        </button>
      </div>

      {/* "Can't Use Feature" block (e.g. Landlord with no listings) */}
      {!loadingState && profileStatus?.isProfileComplete && !featureState.canUseFeature && (
        <div className="bg-white rounded-3xl border border-navy-200 p-8 text-center max-w-2xl mx-auto mt-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-500 flex items-center justify-center mb-4">
            <MdHomeWork size={28} />
          </div>
          <h2 className="text-xl font-heading font-bold text-navy-950 mb-2">
            {activeTab === 'tenants' ? 'Add a listing to unlock this feature' : 'Update your profile to find buddies'}
          </h2>
          <p className="text-navy-500 mb-6">{featureState.message}</p>
          {activeTab === 'tenants' ? (
            <button
              onClick={() => router.push('/listings/new')}
              className="bg-terracotta-500 text-white px-5 py-3 rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-colors"
            >
              Create Listing
            </button>
          ) : (
            <button
              onClick={() => router.push('/profile/settings')}
              className="bg-terracotta-500 text-white px-5 py-3 rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-colors"
            >
              Update Profile
            </button>
          )}
        </div>
      )}

      {/* Profile Incomplete Gate */}
      {!loadingState && profileStatus && !profileStatus.isProfileComplete && (
        <div className="bg-white rounded-3xl border border-navy-200 p-10 text-center max-w-2xl mx-auto mt-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-tr from-terracotta-50 to-orange-50 text-terracotta-500 flex items-center justify-center mb-6 shadow-inner">
            <MdPeopleAlt size={36} />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-navy-950 mb-3 tracking-tight">Unlock Your Matches</h2>
          <p className="text-navy-600 mb-8 text-lg leading-relaxed max-w-lg mx-auto">
            Tell us about yourself and what you're looking for to see who's a 70%+ match. You must complete both your Lifestyle and Match Preferences to access this feed.
          </p>
          <button
            onClick={() => router.push('/profile/settings')}
            className="bg-navy-950 text-white px-8 py-3.5 rounded-xl font-heading font-bold hover:bg-navy-900 transition-all shadow-lg shadow-navy-950/20 hover:-translate-y-0.5"
          >
            Complete Profile Now
          </button>
        </div>
      )}

      {loadingState && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-white border border-navy-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {!loadingState && profileStatus?.isProfileComplete && featureState.canUseFeature && featureState.data?.length === 0 && (
        <div className="bg-white rounded-3xl border border-navy-200 p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-500 flex items-center justify-center mb-4">
            <MdPeopleAlt size={30} />
          </div>
          <h2 className="text-xl font-heading font-bold text-navy-950 mb-2">No 70%+ matches yet</h2>
          <p className="text-navy-500">Try again soon as more seekers complete their profiles.</p>
        </div>
      )}

      {!loadingState && profileStatus?.isProfileComplete && featureState.canUseFeature && featureState.data?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureState.data.map((seeker) => (
            <article key={seeker.user_id} className="bg-white border border-navy-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:shadow-navy-950/5 transition-all">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-full bg-navy-50 overflow-hidden shrink-0">
                    {seeker.profile_picture ? (
                      <img 
                        src={seeker.profile_picture} 
                        alt={seeker.full_name} 
                        className={`w-full h-full object-cover transition-all ${seeker.isBlurry ? 'blur-md scale-110 saturate-50' : ''}`} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy-500 font-heading font-bold">
                        {seeker.full_name?.[0] || '?'}
                      </div>
                    )}
                    {seeker.isBlurry && (
                      <div className="absolute inset-0 bg-navy-950/20 flex items-center justify-center">
                        <MdLock className="text-white drop-shadow-md" size={14} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-navy-950 truncate flex items-center gap-1.5">
                      <span className="truncate">{seeker.full_name}</span>
                      {seeker.isBlurry && (
                        <span className="bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">Private</span>
                      )}
                    </h3>
                    {seeker.current_city && (
                      <div className="text-xs text-navy-500 flex items-center gap-1 mt-0.5">
                        <MdLocationOn size={13} className="text-navy-400" />
                        {seeker.isBlurry ? seeker.current_city.split(',')[0] : seeker.current_city}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-teal-50 text-teal-700 border border-teal-100 rounded-xl px-2.5 py-1 text-xs font-heading font-bold shrink-0">
                  {seeker.match_score}% Match
                </div>
              </div>

              {seeker.bio && (
                <p className="text-sm text-navy-600 line-clamp-2 mb-3">{seeker.bio}</p>
              )}

              {seeker.matched_property && (
                <div className="mb-3 text-xs text-navy-600 bg-navy-50 border border-navy-100 rounded-xl p-2.5">
                  Best fit for your listing: <span className="font-heading font-semibold text-navy-950">{seeker.matched_property.title}</span>
                </div>
              )}

              {Array.isArray(seeker.interests) && seeker.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {seeker.interests.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-lg bg-navy-50 text-navy-700 border border-navy-100 text-[11px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleContactSeeker(seeker)}
                disabled={contactingId === seeker.user_id}
                className="w-full bg-terracotta-500 text-white py-2.5 rounded-xl text-sm font-heading font-semibold hover:bg-terracotta-600 transition-colors disabled:opacity-60 shadow-lg shadow-terracotta-500/10 mt-auto"
              >
                {contactingId === seeker.user_id ? 'Sending...' : activeTab === 'buddies' ? 'Message Buddy' : 'Contact Seeker'}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
