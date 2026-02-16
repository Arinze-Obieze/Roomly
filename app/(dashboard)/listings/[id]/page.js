'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MdLocationOn, MdVerified } from 'react-icons/md';
import { useChat } from '@/contexts/ChatContext';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Components
import PropertyGallery from '@/components/listings/PropertyGallery';
import PropertyHeader from '@/components/listings/PropertyHeader';
import PropertyStats from '@/components/listings/PropertyStats';
import HostSidebar from '@/components/listings/HostSidebar';
import ContactHostModal from '@/components/modals/ContactHostModal';
import VibeMatchCard from '@/components/listings/VibeMatchCard';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const { startConversation } = useChat();
  const { user } = useAuthContext();
  const [contacting, setContacting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Check if current user is the host
  const isOwner = user?.id === property?.host?.id;

  const handleContactHost = () => {
    if (!user) {
        router.push('/login');
        return;
    }
    setIsContactModalOpen(true);
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
            router.push('/messages');
            toast.success('Message sent successfully!');
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
    } finally {
        setContacting(false);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            property_media (
              id,
              url,
              media_type,
              display_order
            ),
            users (
              id,
              full_name,
              profile_picture,
              is_verified
            )
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;
        
        // Check saved status
        if (user) {
            const { count } = await supabase
                .from('saved_properties')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('property_id', params.id);
            setIsSaved(count > 0);
        }

        // Transform media
        const media = data.property_media
            ?.sort((a, b) => a.display_order - b.display_order)
            .map(m => {
                let url = m.url;
                if (!url.startsWith('http')) {
                    url = supabase.storage.from('property-media').getPublicUrl(m.url).data.publicUrl;
                }
                return {
                    url,
                    type: m.media_type || 'image', // Default to image
                    id: m.id
                };
            }) || [];
            
        setProperty({
           ...data,
           media: media.length > 0 ? media : [{ url: '/placeholder-property.jpg', type: 'image' }],
           host: {
             name: data.users?.full_name || 'Unknown Host',
             avatar: data.users?.profile_picture,
             verified: data.users?.is_verified,
             id: data.users?.id
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
  }, [params.id, user]);

  const handleToggleSave = async () => {
    if (!user) return router.push('/login');
    const newStatus = !isSaved;
    setIsSaved(newStatus); // Optimistic
    
    try {
      if (newStatus) {
        await supabase.from('saved_properties').insert({ user_id: user.id, property_id: property.id });
        toast.success('Saved to favorites');
      } else {
        await supabase.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', property.id);
        toast.success('Removed from favorites');
      }
    } catch (err) {
      setIsSaved(!newStatus); // Revert
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this place in ${property.city} on Roomly!`,
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
        <h2 className="text-xl font-bold text-navy-950 mb-2">Property Not Found</h2>
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
          <PropertyGallery media={property.media} title={property.title} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Info */}
             <div className="lg:col-span-2 space-y-8">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{property.title}</h2>
                       <div className="flex items-center gap-2 text-slate-500">
                         <MdLocationOn className="text-terracotta-600 text-lg" />
                         <span>{property.city}, {property.state}</span>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-terracotta-600">€{property.price_per_month}</div>
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
                   <h3 className="text-lg font-bold text-navy-950 mb-4">Description</h3>
                   <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                     {property.description}
                   </div>
                </div>

                {/* Vibe Match Insight */}
                <VibeMatchCard property={property} />

                {/* Rental Details & Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-bold text-navy-950 mb-2">Rental Details</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Deposit</dt>
                                <dd className="font-medium text-slate-900">€{property.deposit || '0'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Bills</dt>
                                <dd className="font-medium text-slate-900 capitalize">{property.bills_option}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-slate-500">Minimum Stay</dt>
                                <dd className="font-medium text-slate-900">{property.min_stay_months} months</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-bold text-navy-950 mb-2">Household Preferences</h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Gender</dt>
                                <dd className="font-medium text-slate-900 capitalize">{property.gender_preference}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-slate-500">Occupation</dt>
                                <dd className="font-medium text-slate-900 capitalize">{property.occupation_preference}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Age Range</dt>
                                <dd className="font-medium text-slate-900">{property.age_min} - {property.age_max}</dd>
                            </div>
                             <div className="flex justify-between">
                                <dt className="text-slate-500">Couples</dt>
                                <dd className="font-medium text-slate-900">{property.couples_allowed ? 'Allowed' : 'Not Allowed'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-navy-950 mb-4">Amenities</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {property.amenities && property.amenities.map((am, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700">
                         <MdVerified className="text-terracotta-500" /> {/* Placeholder icon */}
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
    </div>
  );
}
