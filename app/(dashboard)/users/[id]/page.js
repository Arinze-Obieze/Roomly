'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MdVerified, MdPerson, MdLocationOn, MdCalendarToday, MdArrowBack } from 'react-icons/md';
import { ListingCard } from '@/components/dashboard/ui/ListingCard';
import toast from 'react-hot-toast';

export default function HostProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [host, setHost] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchHostData = async () => {
      try {
        const userId = params.id;
        
        // Fetch User Info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, profile_picture, bio, created_at, is_verified')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Fetch User Listings
        const { data: propertiesData, error: propError } = await supabase
          .from('properties')
          .select(`
            *,
            property_media (
              id,
              url,
              media_type,
              display_order,
              is_primary
            ),
            users (
              id,
              full_name,
              profile_picture
            )
          `)
          .eq('listed_by_user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (propError) throw propError;

        const transformedListings = propertiesData.map(property => {
             const rawUrl = property.property_media?.find(m => m.is_primary)?.url || property.property_media?.[0]?.url;
             let imageUrl = null;
             
             if (rawUrl) {
                 if (rawUrl.startsWith('http')) {
                     imageUrl = rawUrl;
                 } else {
                     imageUrl = supabase.storage.from('property-media').getPublicUrl(rawUrl).data.publicUrl;
                 }
             }

             return {
                id: property.id,
                title: property.title,
                location: `${property.city}, ${property.state}`,
                price: `€${property.price_per_month}`,
                period: 'month',
                image: imageUrl,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                propertyType: property.property_type,
                amenities: (property.amenities || []).map(a => ({ icon: null, label: a })), // Simple mapping
                matchScore: 95, // Placeholder or calculate
                verified: false, // Placeholder
                host: {
                  name: property.users?.full_name || 'Unknown',
                  avatar: property.users?.profile_picture,
                  id: property.listed_by_user_id
                }
             };
          });

        setHost(userData);
        setListings(transformedListings);
      } catch (err) {
        console.error('Error fetching host profile:', err);
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
        fetchHostData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">User Not Found</h2>
        <button onClick={() => router.back()} className="text-cyan-600 font-medium hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-4">
         <button 
           onClick={() => router.back()}
           className="p-2 hover:bg-slate-100 rounded-full transition-colors"
         >
           <MdArrowBack className="text-xl text-slate-700" />
         </button>
         <h1 className="font-semibold text-slate-900 truncate flex-1">{host.full_name}&apos;s Profile</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar: User Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4">
                        {host.profile_picture ? (
                            <img 
                                src={host.profile_picture} 
                                alt={host.full_name} 
                                className="w-full h-full rounded-full object-cover border-4 border-slate-50"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-4xl font-bold border-4 border-slate-50">
                                {host.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                        )}
                        {host.is_verified && (
                            <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm">
                                <MdVerified className="text-cyan-500 text-2xl" title="Verified Host" />
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{host.full_name}</h2>
                    <p className="text-slate-500 text-sm mb-4">Joined {new Date(host.created_at).getFullYear()}</p>

                    {/* Quick Stats or Badges could go here */}
                </div>

                <div className="h-px bg-slate-100 my-6" />

                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">About</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {host.bio || "No bio info provided."}
                    </p>
                </div>
            </div>
          </div>

          {/* Main Content: Listings */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                    {listings.length} Active Listing{listings.length !== 1 ? 's' : ''}
                </h2>
            </div>

            {listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {listings.map(listing => (
                        <ListingCard 
                            key={listing.id} 
                            data={listing} 
                            onSelect={() => router.push(`/listings/${listing.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <MdLocationOn size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No active listings</h3>
                    <p className="text-slate-500">This user has no properties listed at the moment.</p>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
