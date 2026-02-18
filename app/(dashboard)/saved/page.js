'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { ListingCard } from '@/components/dashboard/ui/ListingCard';
import { useRouter } from 'next/navigation';
import { MdFavoriteBorder, MdFavorite, MdHome } from 'react-icons/md';

export default function SavedPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchSaved = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_properties')
          .select(`
            property:properties (
              id,
              title,
              description,
              property_type,
              price_per_month,
              state,
              city,
              street,
              bedrooms,
              bathrooms,
              square_meters,
              amenities,
              created_at,
              images:property_media(url, is_primary),
              host:users!listed_by_user_id(
                id,
                full_name,
                profile_picture
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = data.map(item => {
            const p = item.property;
            if (!p) return null;
            
            const getImageUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http')) return url;
                return supabase.storage.from('property-media').getPublicUrl(url).data.publicUrl;
            };

            const rawPrimary = p.images?.find(img => img.is_primary)?.url;
            const rawFirst = p.images?.[0]?.url;
            
            const displayImage = getImageUrl(rawPrimary) || getImageUrl(rawFirst);

            return {
                id: p.id,
                title: p.title,
                location: `${p.city}, ${p.state}`,
                price: p.price_per_month,
                period: 'month',
                image: displayImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
                bedrooms: p.bedrooms,
                bathrooms: p.bathrooms,
                amenities: p.amenities || [],
                matchScore: 0,
                host: {
                    id: p.host?.id,
                    name: p.host?.full_name || 'Host',
                    avatar: p.host?.profile_picture,
                },
                verified: true
            };
        });

        setProperties(formatted.filter(Boolean));
      } catch (error) {
        console.error('Error fetching saved properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-terracotta-500 rounded-full animate-spin" />
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-navy-400 text-sm font-sans whitespace-nowrap"
          >
            Loading your saved gems...
          </motion.div>
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="p-3 bg-terracotta-50 text-terracotta-500 rounded-xl ring-2 ring-terracotta-500/20">
          <MdFavoriteBorder size={24} />
        </div>
        
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy-950 flex items-center gap-2">
            Saved Properties
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.3 }}
              className="text-sm bg-terracotta-500 text-white px-2 py-0.5 rounded-full font-sans"
            >
              {properties.length}
            </motion.span>
          </h1>
          <p className="text-navy-500 font-sans">Properties you've bookmarked for later</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {properties.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20 bg-white rounded-3xl border border-navy-200 shadow-xl shadow-navy-950/5"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.2 }}
              className="w-20 h-20 bg-terracotta-50 text-terracotta-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-terracotta-500/10"
            >
              <MdFavoriteBorder size={40} />
            </motion.div>
            
            <h2 className="text-xl font-heading font-bold text-navy-950 mb-2">No saved properties yet</h2>
            <p className="text-navy-500 font-sans mb-6">Start exploring to find your perfect place!</p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="bg-terracotta-500 text-white px-6 py-2.5 rounded-xl font-heading font-semibold hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20 inline-flex items-center gap-2"
            >
              <MdHome size={20} />
              Explore Properties
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {properties.map((property, index) => (
              <motion.div 
                key={property.id}
                variants={item}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ListingCard 
                  data={property}
                  onSelect={() => router.push(`/listings/${property.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-terracotta-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>
    </motion.main>
  );
}