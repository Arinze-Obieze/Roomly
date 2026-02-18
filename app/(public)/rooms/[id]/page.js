'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdLocationOn, MdVerified } from 'react-icons/md';
import { useChat } from '@/core/contexts/ChatContext';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { useSavedProperties } from '@/core/contexts/SavedPropertiesContext';
import toast from 'react-hot-toast';

// Components
import PropertyGallery from '@/components/listings/PropertyGallery';
import PropertyHeader from '@/components/listings/PropertyHeader';
import PropertyStats from '@/components/listings/PropertyStats';
import HostSidebar from '@/components/listings/HostSidebar';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { startConversation } = useChat();
  const { user, openLoginModal } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const [contacting, setContacting] = useState(false);

  // Check if current user is the host
  const isOwner = user?.id === property?.host?.id;
  const isSaved = property ? isPropertySaved(property.id) : false;
  const [interestLoading, setInterestLoading] = useState(false);

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
        router.push('/messages');
    }
    setContacting(false);
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params.id}`);
        if (!response.ok) {
           throw new Error('Failed to fetch property');
        }
        const data = await response.json();
        
        // Transform media if necessary (API should handle it, but ensuring)
        const media = data.property_media
            ?.sort((a, b) => a.display_order - b.display_order)
            .map(m => ({
                url: m.url,
                type: m.media_type || 'image',
                id: m.id
            })) || [];
            
        setProperty({
           ...data,
           media: media.length > 0 ? media : [{ url: '/placeholder-property.jpg', type: 'image' }],
           host: {
             name: data.users?.full_name || 'Host',
             avatar: data.users?.profile_picture,
             verified: data.users?.is_verified,
             id: data.users?.id || data.listed_by_user_id
           }
        });
      } catch (err) {
        console.error('Error fetching property:', err);
        toast.error('Could not load property details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
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
         <div className="w-8 h-8 border-4 border-slate-200 border-t-terracotta-500 rounded-full animate-spin"></div>
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
                
                {/* Compatibility Section - Gated */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Compatibility</h3>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center font-bold text-xl">
                                85%
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">Great Match!</p>
                                <p className="text-slate-500 text-sm">Based on your preferences.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-slate-600 mb-4">Sign up to see how compatible you are with this room and host.</p>
                            <button 
                                onClick={() => openLoginModal('Sign up to check compatibility.')}
                                className="text-terracotta-600 font-bold hover:underline"
                            >
                                Check Compatibility
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
                  onViewProfile={() => router.push(user && !property.isBlurry ? `/users/${property.host.id}` : '#')}
                  isPrivate={property.isBlurry}
                />
             </div>
          </div>
       </div>
    </div>
  );
}
