'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdLocationOn, MdVerified } from 'react-icons/md';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useSavedProperties } from '@/core/contexts/SavedPropertiesContext';
import { getMatchBand } from '@/core/services/matching/presentation/match-bands';
import toast from 'react-hot-toast';
import GlobalSpinner from '@/components/ui/GlobalSpinner';

// Components
import PropertyGallery from '@/components/listings/PropertyGallery';
import PropertyHeader from '@/components/listings/PropertyHeader';
import PropertyStats from '@/components/listings/PropertyStats';
import HostSidebar from '@/components/listings/HostSidebar';
import ReportModal from '@/components/modals/ReportModal';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { startConversation } = useChat();
  const { user, openLoginModal } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const [contacting, setContacting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Check if current user is the host
  const isOwner = user?.id === property?.host?.id;
  const matchBand = property?.matchScore != null ? getMatchBand(property.matchScore) : null;
  const isSaved = property ? isPropertySaved(property.id) : false;
  const [interestLoading, setInterestLoading] = useState(false);
  const formatLabel = (value) => String(value || '').replaceAll('_', ' ').trim();
  const billsLabelMap = {
    box: 'All bills included',
    some: 'Some bills included',
    none: 'Bills not included',
  };
  const transportOptions = Array.isArray(property?.transport_options) ? property.transport_options.filter(Boolean) : [];
  const paymentMethods = Array.isArray(property?.payment_methods) ? property.payment_methods.filter(Boolean) : [];
  const idealFlatmateDescription = typeof property?.partner_description === 'string' ? property.partner_description.trim() : '';
  const customBills = Array.isArray(property?.custom_bills) ? property.custom_bills.filter((bill) => bill?.name || bill?.amount) : [];
  const lifestylePriorities = property?.lifestyle_priorities && typeof property.lifestyle_priorities === 'object'
    ? Object.entries(property.lifestyle_priorities)
        .filter(([, priority]) => priority && priority !== 'not_important')
        .map(([key, priority]) => ({
          label: formatLabel(key),
          priority: priority === 'must_match' ? 'Must match' : 'Nice to have',
        }))
    : [];

  const handleShowInterest = async () => {
    if (!user) {
      openLoginModal('Sign up to show interest in this private listing.');
      return;
    }

    try {
      setInterestLoading(true);
      const response = await fetch(`/api/properties/${property.id}/interest`, { method: 'POST' });
      const resData = await response.json();

      if (resData.success) {
        toast.success(resData.message || 'Interest sent! Landlord will be notified.');
        // Refresh property data
        const refreshResponse = await fetch(`/api/properties/${params.id}`);
        const freshData = await refreshResponse.json();
        setProperty(prev => ({
            ...prev,
            interestStatus: freshData.interestStatus || 'pending'
        }));
      } else {
        toast.error(resData.error || 'Failed to send interest');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleContactHost = async () => {
    if (!user) {
        openLoginModal('Log in to message the host.');
        return;
    }

    if (property.isBlurry) {
        handleShowInterest();
        return;
    }
    
    setContacting(true);
    // Start conversation with default message using property context
    const conversationId = await startConversation(
        property.id, 
        property.host.id, 
        `Hi ${property.host.name}, I'm interested in your property in ${property.city}. Is it still available?`
    );

    if (conversationId) {
        router.push(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
    }
    setContacting(false);
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params.id}`, {
          signal: controller.signal
        });
        
        if (!response.ok) {
           throw new Error('Failed to fetch property');
        }
        const data = await response.json();
        
        // Transform media if necessary
        const media = data.property_media
            ?.sort((a, b) => a.display_order - b.display_order)
            .map(m => ({
                url: m.url,
                type: m.media_type || 'image',
                id: m.id
            })) || [];
            
        if (isMounted) {
          setProperty({
             ...data,
             media: media.length > 0 ? media : [{ url: '/placeholder-property.jpg', type: 'image' }],
             host: {
               name: data.users?.full_name || 'Host',
               avatar: data.users?.profile_picture,
               verified: data.users?.is_verified,
               id: data.users?.id || data.listed_by_user_id,
               role: data.listed_by_role || null,
               privacy_setting: data.users?.privacy_setting,
               last_seen: data.users?.last_seen,
               average_response_time_ms: data.users?.average_response_time_ms,
               show_online_status: data.users?.show_online_status,
               show_response_time: data.users?.show_response_time
             }
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching property:', err);
        if (isMounted) toast.error('Could not load property details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [params.id]);

  const handleToggleSave = async () => {
    if (!user) {
        openLoginModal('You need an account to save a property.');
        return;
    }
    toggleSave(property.id);
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this place in ${property.city} on RoomFind!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <GlobalSpinner size="md" color="primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Property Not Found</h2>
        <button onClick={() => router.back()} className="text-terracotta-600 font-medium hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <PropertyHeader 
         title={property.title}
         onBack={() => router.back()}
         onShare={handleShare}
         onToggleSave={handleToggleSave}
         isSaved={isSaved}
         onReport={() => setIsReportOpen(true)}
       />

       <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          <div className={property.isBlurry ? 'blur-2xl pointer-events-none select-none grayscale contrast-125' : ''}>
             <PropertyGallery media={property.media} title={property.title} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Info */}
             <div className="lg:col-span-2 space-y-8">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{property.title}</h2>
                       <div className="flex items-center gap-2 text-slate-500">
                         <MdLocationOn className="text-terracotta-600 text-lg" />
                         <span>
                            {property.street ? `${property.street}, ` : ''}
                            {property.city}, {property.state}
                         </span>
                       </div>
                       {property.isBlurry && (
                          <div className="mt-2 text-xs font-bold text-navy-600 bg-navy-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-navy-100">
                             <MdLock size={14} /> Private Listing &bull; Exact address hidden
                          </div>
                       )}
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:text-right">
                       <div className="text-2xl font-bold text-terracotta-600">
                        {property.isBlurry ? property.price_range : `€${property.price_per_month}`}
                       </div>
                       <div className="text-slate-500 text-sm">per month</div>
                     </div>
                   </div>

                   <PropertyStats 
                     bedrooms={property.bedrooms}
                     bathrooms={property.bathrooms}
                     square_meters={property.square_meters}
                     available_from={property.available_from}
                   />
                </div>

                <div>
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Description</h3>
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                     {property.description}
                   </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Amenities</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {property.amenities && property.amenities.map((am, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700">
                         <MdVerified className="text-navy-500" /> {/* Placeholder icon */}
                         <span className="capitalize">{am.label || am}</span>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-slate-900 mb-3">Rental Details</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Bills</dt>
                        <dd className="font-medium text-slate-900 text-right">{billsLabelMap[property?.bills_option] || formatLabel(property?.bills_option) || 'Not specified'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Minimum Stay</dt>
                        <dd className="font-medium text-slate-900 text-right">{property?.min_stay_months ? `${property.min_stay_months} months` : 'Not specified'}</dd>
                      </div>
                      {property?.rental_type === 'fixed' && property?.fixed_term_duration && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Fixed Term</dt>
                          <dd className="font-medium text-slate-900 text-right">{property.fixed_term_duration} months</dd>
                        </div>
                      )}
                      {paymentMethods.length > 0 && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Payment</dt>
                          <dd className="font-medium text-slate-900 text-right">{paymentMethods.map(formatLabel).join(', ')}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-slate-900 mb-3">Household Preferences</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Gender</dt>
                        <dd className="font-medium text-slate-900 text-right">{formatLabel(property?.gender_preference) || 'Any'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Occupation</dt>
                        <dd className="font-medium text-slate-900 text-right">{formatLabel(property?.occupation_preference) || 'Any'}</dd>
                      </div>
                      {property?.age_min != null && property?.age_max != null && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Age Range</dt>
                          <dd className="font-medium text-slate-900 text-right">{property.age_min} - {property.age_max}</dd>
                        </div>
                      )}
                      {property?.listed_by_role && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Listed By</dt>
                          <dd className="font-medium text-slate-900 text-right">{formatLabel(property.listed_by_role)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {(transportOptions.length > 0 || customBills.length > 0 || idealFlatmateDescription || lifestylePriorities.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {transportOptions.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-3">Nearby Transport</h3>
                        <div className="flex flex-wrap gap-2">
                          {transportOptions.map((option) => (
                            <span key={option} className="px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium">
                              {formatLabel(option)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {customBills.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-3">Estimated Bills</h3>
                        <ul className="space-y-2 text-sm">
                          {customBills.map((bill, index) => (
                            <li key={`${bill.name || 'bill'}-${index}`} className="flex justify-between gap-4 text-slate-700">
                              <span>{bill.name || 'Other'}</span>
                              <span className="font-medium">{bill.amount ? `€${bill.amount}` : 'Varies'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {idealFlatmateDescription && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:col-span-2">
                        <h3 className="text-base font-bold text-slate-900 mb-3">Ideal Flatmate</h3>
                        <p className="text-sm text-slate-700 whitespace-pre-line">{idealFlatmateDescription}</p>
                      </div>
                    )}

                    {lifestylePriorities.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:col-span-2">
                        <h3 className="text-base font-bold text-slate-900 mb-3">Lifestyle Priorities</h3>
                        <div className="flex flex-wrap gap-2">
                          {lifestylePriorities.map((item) => (
                            <span key={`${item.label}-${item.priority}`} className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100 text-xs font-medium">
                              {item.label}: {item.priority}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Compatibility Section - Gated */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Compatibility</h3>
                    {user ? (
                        property.matchScore != null ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center font-bold text-xl">
                                {property.matchScore}%
                              </div>
                              <div>
                                  <p className="font-semibold text-slate-900">
                                    {matchBand?.label || 'Match'}
                                  </p>
                                  <p className="text-slate-500 text-sm">Based on your lifestyle and match preferences.</p>
                                  {property.matchConfidenceState && property.matchConfidenceState !== 'high' && (
                                    <p className={`mt-1 text-xs font-medium ${
                                      property.matchConfidenceState === 'low'
                                        ? 'text-amber-700'
                                        : 'text-slate-500'
                                    }`}>
                                      {property.matchConfidenceLabel || 'Limited data'} behind this score.
                                    </p>
                                  )}
                              </div>
                          </div>
                          {Array.isArray(property.matchReasons) && property.matchReasons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {property.matchReasons.slice(0, 3).map((reason) => (
                                <span
                                  key={reason}
                                  className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100 text-xs font-medium"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        ) : property.missingProfile ? (
                          <div className="text-center py-4 bg-terracotta-50 rounded-xl border border-terracotta-100">
                             <p className="text-terracotta-800 text-sm font-medium mb-3">Complete your lifestyle in Profile to see your match score.</p>
                             <button 
                                 onClick={() => router.push('/profile?tab=lifestyle')}
                                 className="px-6 py-2 bg-terracotta-600 text-white font-bold rounded-xl shadow-md hover:bg-terracotta-700 transition-colors text-sm"
                             >
                                 Complete Lifestyle
                             </button>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                             <GlobalSpinner size="xs" color="slate" />
                             Compatibility score is being computed...
                          </div>
                        )
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-slate-600 mb-4">Login to see how compatible you are with this room and host.</p>
                            <button 
                                onClick={() => openLoginModal('Login to check compatibility.')}
                                className="text-terracotta-600 font-bold hover:underline"
                            >
                                Login to Check Compatibility
                            </button>
                        </div>
                    )}
                </div>

             </div>

             {/* Sidebar / Host Info */}
             <div className="lg:col-span-1">
                <HostSidebar 
                  host={property.host}
                  isOwner={isOwner}
                  contacting={contacting}
                  onContactHost={handleContactHost}
                  contactButtonText={
                    property.isPrivate && property.interestStatus !== 'accepted'
                        ? (property.interestStatus === 'pending' ? 'Interest Sent' : 'Show Interest')
                        : 'Message Host'
                  }
                  onEditListing={() => router.push('/my-properties')}
                  onViewProfile={() => property.host?.id && router.push(`/users/${property.host.id}`)}
                  isPrivate={property.isBlurry}
                />
             </div>
          </div>
       </div>

       <ReportModal 
         isOpen={isReportOpen}
         onClose={() => setIsReportOpen(false)}
         itemType="property"
         itemId={property.id}
         itemTitle={property.title}
       />
    </div>
  );
}
