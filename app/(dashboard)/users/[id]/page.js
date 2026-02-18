'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/core/utils/supabase/client';
import { MdVerified, MdPerson, MdLocationOn, MdCalendarToday, MdArrowBack, MdCheckCircle } from 'react-icons/md';
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
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, profile_picture, bio, created_at, is_verified')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

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
                price: property.price_per_month,
                period: 'monthly',
                image: imageUrl,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                propertyType: property.property_type,
                amenities: (property.amenities || []).map(a => ({ icon: null, label: a })),
                matchScore: 95,
                verified: false,
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
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!host) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-navy-50 flex flex-col items-center justify-center p-4"
      >
        <div className="bg-white rounded-3xl border border-navy-200 p-8 max-w-md text-center shadow-xl shadow-navy-950/5">
          <div className="w-16 h-16 bg-terracotta-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdPerson className="text-terracotta-500" size={32} />
          </div>
          <h2 className="text-xl font-heading font-bold text-navy-950 mb-2">User Not Found</h2>
          <p className="text-navy-500 font-sans mb-6">The profile you're looking for doesn't exist or has been removed.</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()} 
            className="bg-terracotta-500 text-white px-6 py-2 rounded-xl font-heading font-medium hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20"
          >
            Go Back
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-navy-50 pb-20"
    >
      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-navy-200 px-4 py-3 flex items-center gap-4"
      >
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="p-2 hover:bg-navy-50 rounded-full transition-colors"
        >
          <MdArrowBack className="text-xl text-navy-600" />
        </motion.button>
        
        <h1 className="font-heading font-semibold text-navy-950 truncate flex-1">
          {host.full_name}&apos;s Profile
        </h1>

        {host.is_verified && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-teal-50 text-teal-600 px-3 py-1 rounded-full border border-teal-200"
          >
            <MdVerified className="text-teal-500" size={16} />
            <span className="text-xs font-heading font-medium">Verified Host</span>
          </motion.div>
        )}
      </motion.div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar: User Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-navy-200 p-6 shadow-xl shadow-navy-950/5">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 mb-4">
                  {host.profile_picture ? (
                    <motion.img 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      src={host.profile_picture} 
                      alt={host.full_name} 
                      className="w-full h-full rounded-full object-cover border-4 border-white ring-2 ring-terracotta-500/20"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center text-4xl font-heading font-bold border-4 border-white ring-2 ring-terracotta-500/20">
                      {host.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  )}
                  
                  {host.is_verified && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.3 }}
                      className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-lg"
                    >
                      <MdVerified className="text-teal-500 text-2xl" />
                    </motion.div>
                  )}
                </div>
                
                <h2 className="text-2xl font-heading font-bold text-navy-950 mb-1">{host.full_name}</h2>
                
                <div className="flex items-center gap-1 text-navy-500 text-sm font-sans mb-4">
                  <MdCalendarToday className="text-terracotta-400" size={14} />
                  <span>Joined {new Date(host.created_at).getFullYear()}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 w-full mt-2">
                  <div className="text-center p-3 bg-navy-50 rounded-xl border border-navy-200">
                    <div className="text-xl font-heading font-bold text-terracotta-600">{listings.length}</div>
                    <div className="text-xs font-sans text-navy-500">Listings</div>
                  </div>
                  <div className="text-center p-3 bg-navy-50 rounded-xl border border-navy-200">
                    <div className="text-xl font-heading font-bold text-teal-600">100%</div>
                    <div className="text-xs font-sans text-navy-500">Response</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-navy-100 my-6" />

              <div>
                <h3 className="text-sm font-heading font-bold text-navy-950 uppercase tracking-wide mb-3">About</h3>
                <p className="text-navy-600 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                  {host.bio || "No bio info provided."}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content: Listings */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold text-navy-950 flex items-center gap-2">
                Active Listings
                <span className="text-sm bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full font-sans">
                  {listings.length}
                </span>
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {listings.length > 0 ? (
                <motion.div 
                  key="listings"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  {listings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ListingCard 
                        data={listing} 
                        onSelect={() => router.push(`/listings/${listing.id}`)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl border border-navy-200 p-12 text-center shadow-xl shadow-navy-950/5"
                >
                  <div className="w-16 h-16 bg-terracotta-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdLocationOn className="text-terracotta-500" size={32} />
                  </div>
                  <h3 className="text-lg font-heading font-medium text-navy-950 mb-1">No active listings</h3>
                  <p className="text-navy-500 font-sans">This user has no properties listed at the moment.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}