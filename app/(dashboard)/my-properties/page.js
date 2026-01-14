'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import MyListingCard from '@/components/dashboard/MyListingCard';
import CreateListingForm from '@/components/CreateListingForm';
import { MdAddCircleOutline, MdSentimentDissatisfied } from 'react-icons/md';

export default function MyPropertiesPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [isLoadingProps, setIsLoadingProps] = useState(true);
  const [editingProperty, setEditingProperty] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchProperties = async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_media (
            url,
            is_primary,
            display_order
          )
        `)
        .eq('listed_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform media URLs
      const transformedData = data.map(property => {
        const getImageUrl = (url) => {
            if (!url) return null;
            if (url.startsWith('http')) return url;
            return supabase.storage.from('property-media').getPublicUrl(url).data.publicUrl;
        };

        return {
           ...property,
           property_media: property.property_media?.map(media => ({
             ...media,
             url: getImageUrl(media.url)
           }))
        };
      });

      setProperties(transformedData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoadingProps(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const handleDelete = (deletedId) => {
    setProperties(prev => prev.filter(p => p.id !== deletedId));
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {editingProperty && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
          <CreateListingForm 
            onClose={() => {
              setEditingProperty(null);
              fetchProperties(); // Refresh list after edit
            }}
            initialData={editingProperty}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
          <p className="text-slate-500 mt-1">Manage your active listings</p>
        </div>
        <button
          onClick={() => router.push('/listings/new')}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <MdAddCircleOutline size={20} />
          <span className="hidden sm:inline">List New Property</span>
        </button>
      </div>

      {isLoadingProps ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[340px] bg-slate-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <MdSentimentDissatisfied size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties listed yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm">
            You haven't listed any properties yet. Start earning by listing your space today!
          </p>
          <button
            onClick={() => router.push('/listings/new')}
            className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-cyan-600 transition-colors"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(property => (
            <MyListingCard
              key={property.id}
              property={property}
              onEdit={setEditingProperty}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
