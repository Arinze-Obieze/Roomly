'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { MdLocationOn, MdCheckCircle } from 'react-icons/md';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useSavedProperties } from '@/core/contexts/SavedPropertiesContext';
import toast from 'react-hot-toast';

// Components
import PropertyGallery from '@/components/listings/PropertyGallery';
import PropertyHeader from '@/components/listings/PropertyHeader';
import PropertyStats from '@/components/listings/PropertyStats';
import HostSidebar from '@/components/listings/HostSidebar';
import ContactHostModal from '@/components/modals/ContactHostModal';
import VibeMatchCard from '@/components/listings/VibeMatchCard';
import ReportModal from '@/components/modals/ReportModal';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { startConversation } = useChat();
  const { user } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const [contacting, setContacting] = useState(false);

  // Derive isSaved from context instead of local state
  const isSaved = isPropertySaved(property?.id);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Check if current user is the host
  const isOwner = user?.id === property?.host?.id;
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

  const handleContactHost = async () => {
    if (!user) {
        router.push('/login');
        return;
    }

    if (property?.contactGate === 'profile_required') {
      router.push('/profile?tab=lifestyle');
      return;
    }

    if (property?.contactGate === 'interest_required') {
      try {
        const res = await fetch('/api/interests/show-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: property.id }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'Failed to submit interest');
        toast.success(payload.message || 'Interest submitted!');
        setProperty(prev => prev ? { ...prev, interestStatus: payload.status || 'pending', contactAllowed: false } : prev);
      } catch (e) {
        toast.error(e.message || 'Failed to submit interest');
      }
      return;
    }

    if (property?.contactAllowed) {
      setIsContactModalOpen(true);
    }
  };

  const handleSendMessage = async (message) => {
    setContacting(true);
    try {
        const conversationId = await startConversation(
            property.id, 
            property.host.id, 
            message
        );

        if (conversationId) {
            router.push(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
            toast.success('Message sent successfully!');
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
    } finally {
        setContacting(false);
    }
  };



  useEffect(() => {
    let isMounted = true;
    
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${params.id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Could not load property details');
        }

        const media = (data.property_media || [])
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map(m => ({ url: m.url, type: m.media_type || 'image', id: m.id }));
            
        if (isMounted) {
          setProperty({
            ...data,
            media: media.length > 0 ? media : [{ url: '/placeholder-property.jpg', type: 'image' }],
            host: {
              name: data.users?.full_name || 'Unknown Host',
              avatar: data.users?.profile_picture,
              id: data.users?.id,
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
    };
  }, [params.id]);

  const handleToggleSave = () => {
    if (!user) return router.push('/login');
    if (property) toggleSave(property.id);
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
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
         <GlobalSpinner size="md" color="primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-navy-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-navy-950 mb-2">Property Not Found</h2>
        <button onClick={() => router.back()} className="text-terracotta-600 font-medium hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50 pb-20">
       <PropertyHeader 
         title={property.title}
         onBack={() => router.back()}
         onShare={handleShare}
         onToggleSave={handleToggleSave}
         isSaved={isSaved}
         onReport={() => setIsReportOpen(true)}
       />

       <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          <PropertyGallery media={property.media} title={property.title} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Info */}
             <div className="lg:col-span-2 space-y-8">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h2 className="text-2xl font-bold text-navy-950 mb-2">{property.title}</h2>
                       <div className="flex items-center gap-2 text-navy-500">
                         <MdLocationOn className="text-terracotta-600 text-lg" />
                         <span>{property.city}, {property.state}</span>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-terracotta-600">
                         {property.isBlurry ? (property.price_range || '€—') : `€${property.price_per_month}`}
                       </div>
                       <div className="text-navy-500 text-sm">per month</div>
                     </div>
                   </div>

                   <PropertyStats 
                     bedrooms={property.bedrooms}
                     bathrooms={property.bathrooms}
                     square_meters={property.square_meters}
                     available_from={property.available_from}
                     property_type={property.property_type}
                     offering_type={property.offering_type}
                   />
                </div>

                <div>
                   <h3 className="text-lg font-bold text-navy-950 mb-4">Description</h3>
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                     {property.description}
                   </div>
                </div>

                {/* Vibe Match Insight */}
                <VibeMatchCard property={property} />

                {/* Rental Details & Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-navy-50 p-4 rounded-xl border border-navy-100">
                        <h4 className="font-bold text-navy-950 mb-2">Rental Details</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-navy-500">Deposit</dt>
                                <dd className="font-medium text-navy-950">€{property.deposit || '0'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-navy-500">Rental Type</dt>
                                <dd className="font-medium text-navy-950 capitalize">{(property.rental_type || 'monthly').replaceAll('_', ' ')}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-navy-500">Bills</dt>
                                <dd className="font-medium text-navy-950">{billsLabelMap[property.bills_option] || formatLabel(property.bills_option) || 'Not specified'}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-navy-500">Minimum Stay</dt>
                                <dd className="font-medium text-navy-950">{property.min_stay_months} months</dd>
                            </div>
                            {property.rental_type === 'fixed' && property.fixed_term_duration && (
                              <div className="flex justify-between">
                                  <dt className="text-navy-500">Fixed Term</dt>
                                  <dd className="font-medium text-navy-950">{property.fixed_term_duration} months</dd>
                              </div>
                            )}
                            {paymentMethods.length > 0 && (
                              <div className="flex justify-between gap-4">
                                  <dt className="text-navy-500 shrink-0">Payment</dt>
                                  <dd className="font-medium text-navy-950 text-right">{paymentMethods.map(formatLabel).join(', ')}</dd>
                              </div>
                            )}
                        </dl>
                    </div>
                    <div className="bg-navy-50 p-4 rounded-xl border border-navy-100">
                        <h4 className="font-bold text-navy-950 mb-2">Household Preferences</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-navy-500">Gender</dt>
                                <dd className="font-medium text-navy-950 capitalize">{property.gender_preference}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-navy-500">Occupation</dt>
                                <dd className="font-medium text-navy-950 capitalize">{property.occupation_preference}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-navy-500">Age Range</dt>
                                <dd className="font-medium text-navy-950">{property.age_min} - {property.age_max}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-navy-500">Couples</dt>
                                <dd className="font-medium text-navy-950">{property.couples_allowed ? 'Allowed' : 'Not Allowed'}</dd>
                            </div>
                            {property.listed_by_role && (
                              <div className="flex justify-between gap-4">
                                  <dt className="text-navy-500">Listed By</dt>
                                  <dd className="font-medium text-navy-950 text-right">{formatLabel(property.listed_by_role)}</dd>
                              </div>
                            )}
                        </dl>
                    </div>
                </div>

                {(transportOptions.length > 0 || customBills.length > 0 || idealFlatmateDescription || lifestylePriorities.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {transportOptions.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-navy-100">
                        <h4 className="font-bold text-navy-950 mb-2">Nearby Transport</h4>
                        <div className="flex flex-wrap gap-2">
                          {transportOptions.map((option) => (
                            <span key={option} className="px-3 py-1.5 rounded-full bg-navy-50 text-navy-700 border border-navy-100 text-xs font-medium">
                              {formatLabel(option)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {customBills.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-navy-100">
                        <h4 className="font-bold text-navy-950 mb-2">Estimated Bills</h4>
                        <ul className="space-y-2 text-sm">
                          {customBills.map((bill, index) => (
                            <li key={`${bill.name || 'bill'}-${index}`} className="flex justify-between gap-4 text-navy-700">
                              <span>{bill.name || 'Other'}</span>
                              <span className="font-medium">{bill.amount ? `€${bill.amount}` : 'Varies'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {idealFlatmateDescription && (
                      <div className="bg-white p-4 rounded-xl border border-navy-100 sm:col-span-2">
                        <h4 className="font-bold text-navy-950 mb-2">Ideal Flatmate</h4>
                        <p className="text-sm text-navy-700 whitespace-pre-line">{idealFlatmateDescription}</p>
                      </div>
                    )}

                    {lifestylePriorities.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-navy-100 sm:col-span-2">
                        <h4 className="font-bold text-navy-950 mb-2">Lifestyle Priorities</h4>
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

                <div>
                   <h3 className="text-lg font-bold text-navy-950 mb-4">Amenities</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {property.amenities && property.amenities.map((am, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl border border-navy-100 text-sm font-medium text-navy-700">
                         <MdCheckCircle className="text-terracotta-500" />
                         <span className="capitalize">{am.label || am}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>

             {/* Sidebar / Host Info */}
             <div className="lg:col-span-1">
                <HostSidebar 
                  host={property.host}
                  isOwner={isOwner}
                  contacting={contacting}
                  onContactHost={handleContactHost}
                  onEditListing={() => router.push('/my-properties')}
                  onViewProfile={() => router.push(`/users/${property.host.id}`)}
                  contactButtonText={
                    property.contactGate === 'profile_required'
                      ? 'Complete profile to contact'
                      : property.contactGate === 'interest_required'
                        ? (property.interestStatus === 'pending' ? 'Interest Sent' : 'Show Interest')
                        : 'Contact Host'
                  }
                  isPrivate={!!property.isBlurry}
                />
             </div>
          </div>
       </div>

       <ContactHostModal 
         isOpen={isContactModalOpen}
         onClose={() => setIsContactModalOpen(false)}
         host={property.host}
         propertyTitle={property.title}
         onSend={handleSendMessage}
       />

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
