'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/core/utils/supabase/client';
import { useAuthContext } from '@/core/contexts/AuthContext';
import { ListingCard } from '@/components/dashboard/ui/ListingCard';
import { useRouter } from 'next/navigation';
import { MdFavoriteBorder } from 'react-icons/md';

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

        // Transform data to match ListingCard expectations
        const formatted = data.map(item => {
            const p = item.property;
            if (!p) return null; // Handle orphaned saves
            
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
                price: `€${p.price_per_month}`,
                period: 'month',
                image: displayImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
                amenities: p.amenities || [],
                matchScore: 0, // Saved items don't strictly need a match score logic yet
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
        console.error('Error fetching saved properties:', error.message, error.details, error.hint);
        console.dir(error); // Log full object structure
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
            <MdFavoriteBorder size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Saved Properties</h1>
            <p className="text-slate-500">Properties you've bookmarked for later</p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdFavoriteBorder size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No saved properties yet</h2>
          <p className="text-slate-500 mb-6">Start exploring to find your perfect place!</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-cyan-600 transition-colors"
          >
            Explore Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(property => (
            <ListingCard 
              key={property.id} 
              data={property}
              onSelect={() => router.push(`/listings/${property.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
