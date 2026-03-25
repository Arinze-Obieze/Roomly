'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdHomeWork, MdPeopleAlt, MdRefresh } from 'react-icons/md';
import toast from 'react-hot-toast';
import FindLandlordsSection from '@/components/find-people/FindLandlordsSection';
import FindTenantsSection from '@/components/find-people/FindTenantsSection';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { buildMatchAnalyticsMetadata } from '@/core/services/matching/presentation/match-analytics';
import { isLatestDashboardRequest } from '@/core/utils/dashboard-fetch-guards';
import { fetchWithCsrf } from '@/core/utils/fetchWithCsrf';

const PAGE_SIZE = 12;
const INITIAL_PAGINATION = {
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};
const SHOW_DEV_DIAGNOSTICS = process.env.NODE_ENV !== 'production';

export default function FindPeoplePage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [activeTab, setActiveTab] = useState('tenants');
  const [loadingState, setLoadingState] = useState(true);
  const [profileStatus, setProfileStatus] = useState(null);
  const [pageByTab, setPageByTab] = useState({
    tenants: 1,
    landlords: 1,
  });
  const [featureState, setFeatureState] = useState({
    canUseFeature: true,
    reason: '',
    message: '',
    listingCount: 0,
    approvedListingCount: 0,
    pendingListingCount: 0,
    minMatch: 70,
    topMatchBelowThreshold: null,
    totalCandidatesScored: 0,
    data: [],
    pagination: INITIAL_PAGINATION,
  });
  const [contactingId, setContactingId] = useState(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const loggedImpressionsRef = useRef(new Set());

  const currentPage = pageByTab[activeTab] || 1;

  const logEvent = async (action, metadata = {}, tab = activeTab) => {
    try {
      fetchWithCsrf('/api/analytics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: 'discovery',
          action,
          metadata: { ...metadata, tab },
        }),
      }).catch(() => {});
    } catch (error) {
      console.error('[Find People Analytics] Failed to log event:', error);
    }
  };

  const getPersonRankPosition = (person, tab = activeTab) => {
    if (!person?.user_id) return null;
    const index = featureState.data.findIndex((entry) => entry?.user_id === person.user_id);
    if (index < 0) return null;
    const pageOffset = Math.max(0, ((pageByTab[tab] || 1) - 1) * PAGE_SIZE);
    return pageOffset + index + 1;
  };

  const buildPeopleAnalyticsMetadata = (person, tab, minMatch, rankPosition = null) => ({
    ...buildMatchAnalyticsMetadata({
      matchScore: person?.match_score ?? null,
      threshold: minMatch ?? 70,
      surface: 'find_people',
      entityType: 'person',
      userId: user?.id || null,
      blurred: !!person?.isBlurry,
      revealState: person?.can_contact_directly ? 'revealed' : (person?.isBlurry ? 'blurred' : 'revealed'),
      rankPosition,
      privacyState: person?.is_private_profile ? 'private' : 'public',
      profileCompletionState: person?.profile_completion_state || (
        typeof person?.has_match_preferences === 'boolean'
          ? (person.has_match_preferences ? 'complete' : 'partial')
          : null
      ),
      extra: {
        target_user_id: person?.user_id || null,
        property_id: person?.matched_property?.id || null,
        cta_state: person?.cta_state || null,
        reveal_source: person?.reveal_source || null,
      },
    }),
    tab,
  });

  const fetchMatches = async ({ tab = activeTab, page = currentPage } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingState(true);

    try {
      const statusRes = await fetch('/api/user/profile-status', { signal: controller.signal });
      if (!statusRes.ok) throw new Error('Failed to verify profile status');

      const status = await statusRes.json();
      const normalizedStatus = {
        ...status,
        isProfileComplete: tab === 'landlords' ? !!status.hasLifestyle : true,
      };
      if (!isLatestDashboardRequest(requestId, requestIdRef.current)) return;
      setProfileStatus(normalizedStatus);

      if (!normalizedStatus.isProfileComplete) {
        if (isLatestDashboardRequest(requestId, requestIdRef.current)) {
          setFeatureState((prev) => ({
            ...prev,
            data: [],
            pagination: INITIAL_PAGINATION,
          }));
        }
        return;
      }

      const endpoint = tab === 'tenants'
        ? `/api/landlord/find-people?minMatch=70&limit=${PAGE_SIZE}&page=${page}`
        : `/api/seeker/find-landlords?minMatch=70&limit=${PAGE_SIZE}&page=${page}`;

      const res = await fetch(endpoint, { signal: controller.signal });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load matches');
      if (!isLatestDashboardRequest(requestId, requestIdRef.current)) return;

      const nextPagination = payload.pagination || INITIAL_PAGINATION;
      setFeatureState({
        ...payload,
        pagination: nextPagination,
      });

      if (nextPagination.page !== page) {
        setPageByTab((prev) => ({ ...prev, [tab]: nextPagination.page }));
      }

      if (payload.data?.length > 0) {
        logEvent('view_results', {
          count: payload.data.length,
          page: nextPagination.page,
          total: nextPagination.total,
        }, tab);

        payload.data.forEach((person, index) => {
          const impressionKey = `${tab}:${nextPagination.page}:${person.user_id}:${person.matched_property?.id || 'none'}`;
          if (loggedImpressionsRef.current.has(impressionKey)) return;
          loggedImpressionsRef.current.add(impressionKey);
          const rankPosition = ((nextPagination.page || 1) - 1) * PAGE_SIZE + index + 1;
          logEvent('result_impression', buildPeopleAnalyticsMetadata(person, tab, payload.minMatch, rankPosition), tab);
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (isLatestDashboardRequest(requestId, requestIdRef.current)) {
        setFeatureState((prev) => ({
          ...prev,
          data: [],
          pagination: INITIAL_PAGINATION,
        }));
        toast.error(error.message || 'Failed to load matches');
      }
    } finally {
      if (isLatestDashboardRequest(requestId, requestIdRef.current)) {
        setLoadingState(false);
      }
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

  const handleContactSeeker = async (person) => {
    if (!person?.user_id || contactingId) return;
    if (!person?.matched_property?.id) {
      toast('Contacting this person directly is coming soon.');
      return;
    }

    setContactingId(person.user_id);
    try {
      logEvent(
        'result_contact_click',
        buildPeopleAnalyticsMetadata(person, activeTab, featureState.minMatch, getPersonRankPosition(person, activeTab)),
        activeTab
      );
      const csrfToken = await getCSRFToken();
      const ctaState = person?.cta_state || 'contact';

      if (ctaState === 'show_interest') {
        if (activeTab === 'landlords') {
          const res = await fetch('/api/interests/show-interest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
              propertyId: person.matched_property.id,
            }),
          });

          const payload = await res.json();
          if (!res.ok) throw new Error(payload.error || 'Failed to show interest');

          toast.success(payload.message || 'Interest submitted');
          await fetchMatches({ tab: activeTab, page: currentPage });
          return;
        }

        const res = await fetch('/api/people-interests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            targetUserId: person.user_id,
            contextPropertyId: person.matched_property.id,
            interestKind: 'host_to_seeker',
            compatibilityScore: person.match_score,
          }),
        });

        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to show interest');

        toast.success(payload.message || 'Interest submitted');
        return;
      }

      const introMessage = activeTab === 'tenants'
        ? `Hi ${person.full_name?.split(' ')[0] || ''}, I saw your ${person.match_score}% match for my listing "${person.matched_property.title}". Let me know if you'd like to discuss next steps.`
        : `Hi ${person.full_name?.split(' ')[0] || ''}, I'm interested in your room "${person.matched_property.title}". We have a ${person.match_score}% lifestyle match!`;

      const res = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          targetId: person.user_id,
          propertyId: person.matched_property.id,
          message: introMessage,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to contact seeker');

      toast.success('Message sent');
      router.push(`/messages?conversationId=${encodeURIComponent(payload.conversationId)}`);
    } catch (error) {
      toast.error(error.message || 'Failed to contact seeker');
    } finally {
      setContactingId(null);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage === currentPage || loadingState) return;
    setPageByTab((prev) => ({ ...prev, [activeTab]: nextPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProfile = (person) => {
    if (!person?.user_id) return;
    logEvent(
      'result_profile_open',
      buildPeopleAnalyticsMetadata(person, activeTab, featureState.minMatch, getPersonRankPosition(person, activeTab)),
      activeTab
    );
    router.push(`/users/${person.user_id}`);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchMatches({ tab: activeTab, page: currentPage });
    }
  }, [activeTab, currentPage, loading, router, user]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
              : `Find landlords whose rooms match your lifestyle by ${featureState.minMatch || 70}%+.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchMatches({ tab: activeTab, page: currentPage })}
          disabled={loadingState}
          className="shrink-0 bg-white border border-navy-200 px-4 py-2.5 rounded-xl text-sm font-heading font-semibold hover:bg-navy-50 transition-colors flex items-center gap-2 disabled:opacity-60 text-navy-600"
        >
          <MdRefresh />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-navy-200 mb-8 pt-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('tenants');
            logEvent('switch_tab', { target: 'tenants' }, 'tenants');
          }}
          className={`pb-3 px-4 text-sm font-heading font-bold border-b-2 transition-colors ${
            activeTab === 'tenants' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-navy-500 hover:text-navy-700'
          }`}
        >
          Find Tenants
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('landlords');
            logEvent('switch_tab', { target: 'landlords' }, 'landlords');
          }}
          className={`pb-3 px-4 text-sm font-heading font-bold border-b-2 transition-colors ${
            activeTab === 'landlords' ? 'border-terracotta-500 text-terracotta-600' : 'border-transparent text-navy-500 hover:text-navy-700'
          }`}
        >
          Find Landlords
        </button>
      </div>

      {!loadingState && profileStatus?.isProfileComplete && !featureState.canUseFeature && (
        <div className="bg-white rounded-3xl border border-navy-200 p-8 text-center max-w-2xl mx-auto mt-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-500 flex items-center justify-center mb-4">
            <MdHomeWork size={28} />
          </div>
          <h2 className="text-xl font-heading font-bold text-navy-950 mb-2">
            {activeTab === 'tenants'
              ? featureState.reason === 'pending_approval'
                ? 'Your listing is being reviewed'
                : 'Add a listing to unlock this feature'
              : 'Update your profile to find landlords'}
          </h2>
          <p className="text-navy-500 mb-6">{featureState.message}</p>
          {activeTab === 'tenants' ? (
            <button
              type="button"
              onClick={() => router.push(featureState.reason === 'pending_approval' ? '/my-properties' : '/listings/new')}
              className="bg-terracotta-500 text-white px-5 py-3 rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-colors"
            >
              {featureState.reason === 'pending_approval' ? 'View My Properties' : 'Create Listing'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="bg-terracotta-500 text-white px-5 py-3 rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-colors"
            >
              Update Profile
            </button>
          )}
        </div>
      )}

      {SHOW_DEV_DIAGNOSTICS && activeTab === 'tenants' && featureState?.diagnostics && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-heading font-bold text-amber-950 uppercase tracking-wider">Dev Diagnostics</h2>
              <p className="text-sm text-amber-800">Raw tenant funnel counts for this landlord feed.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(featureState.diagnostics).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-amber-200 bg-white/80 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wider text-amber-700">
                  {key.replaceAll('_', ' ')}
                </div>
                <div className="text-lg font-heading font-bold text-amber-950">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingState && profileStatus && !profileStatus.isProfileComplete && (
        <div className="bg-white rounded-3xl border border-navy-200 p-10 text-center max-w-2xl mx-auto mt-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 mx-auto rounded-4xl bg-linear-to-tr from-terracotta-50 to-orange-50 text-terracotta-500 flex items-center justify-center mb-6 shadow-inner">
            <MdPeopleAlt size={36} />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-navy-950 mb-3 tracking-tight">Unlock Your Matches</h2>
          <p className="text-navy-600 mb-8 text-lg leading-relaxed max-w-lg mx-auto">
            {activeTab === 'landlords'
              ? 'Complete your Lifestyle profile to unlock landlord matching.'
              : 'Complete your profile to unlock this feed.'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/profile')}
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
          <p className="text-navy-500 max-w-xl mx-auto">
            {activeTab === 'tenants' && featureState.totalCandidatesScored > 0
              ? `We found ${featureState.totalCandidatesScored} candidate${featureState.totalCandidatesScored === 1 ? '' : 's'}, but the highest score so far is ${featureState.topMatchBelowThreshold || 0}%. You will start seeing tenants here once someone reaches the ${featureState.minMatch || 70}% threshold.`
              : 'Try again soon as more seekers complete their profiles.'}
          </p>
        </div>
      )}

      {!loadingState && profileStatus?.isProfileComplete && featureState.canUseFeature && featureState.data?.length > 0 && (
        activeTab === 'tenants' ? (
          <FindTenantsSection
            data={featureState.data}
            contactingId={contactingId}
            onContact={handleContactSeeker}
            onOpenProfile={handleOpenProfile}
            pagination={featureState.pagination}
            onPageChange={handlePageChange}
            isLoading={loadingState}
          />
        ) : (
          <FindLandlordsSection
            data={featureState.data}
            contactingId={contactingId}
            onContact={handleContactSeeker}
            onOpenProfile={handleOpenProfile}
            pagination={featureState.pagination}
            onPageChange={handlePageChange}
            isLoading={loadingState}
          />
        )
      )}
    </main>
  );
}
