'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MdLocationOn, MdArrowBack, MdOutlineBed, MdBathtub, MdSquareFoot, MdVerified, MdPerson, MdCalendarToday } from 'react-icons/md';
import { FaWifi, FaPaw, FaShower, FaTree } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

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
        
        // Transform images
        const images = data.property_media
            ?.sort((a, b) => a.display_order - b.display_order)
            .map(m => {
                if (m.url.startsWith('http')) return m.url;
                return supabase.storage.from('property-media').getPublicUrl(m.url).data.publicUrl;
            }) || [];
            
        setProperty({
           ...data,
           images: images.length > 0 ? images : ['/placeholder-property.jpg'],
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
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Property Not Found</h2>
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
         <h1 className="font-semibold text-slate-900 truncate flex-1">{property.title}</h1>
       </div>

       <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          
          {/* Image Gallery */}
          <div className="rounded-2xl overflow-hidden bg-slate-200 mb-8 shadow-sm">
             <div className="aspect-video relative">
               <img 
                 src={property.images[activeImage]} 
                 alt={property.title}
                 className="w-full h-full object-cover transition-opacity duration-300"
               />
               
               {property.images.length > 1 && (
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-full">
                   {property.images.map((_, idx) => (
                     <button
                       key={idx}
                       onClick={() => setActiveImage(idx)}
                       className={`w-2 h-2 rounded-full transition-all ${
                         activeImage === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                       }`}
                     />
                   ))}
                 </div>
               )}
             </div>
             {/* Thumbs for desktop */}
             {property.images.length > 1 && (
               <div className="hidden md:flex gap-2 p-2 overflow-x-auto bg-white">
                 {property.images.map((img, idx) => (
                   <button
                     key={idx}
                     onClick={() => setActiveImage(idx)}
                     className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 transition-all ${
                       activeImage === idx ? 'ring-2 ring-cyan-500 opacity-100' : 'opacity-60 hover:opacity-100'
                     }`}
                   >
                     <img src={img} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Main Info */}
             <div className="lg:col-span-2 space-y-8">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h2 className="text-2xl font-bold text-slate-900 mb-2">{property.title}</h2>
                       <div className="flex items-center gap-2 text-slate-500">
                         <MdLocationOn className="text-cyan-600 text-lg" />
                         <span>{property.city}, {property.state}</span>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-cyan-600">€{property.price_per_month}</div>
                       <div className="text-slate-500 text-sm">per month</div>
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-4 py-6 border-y border-slate-200">
                      <div className="flex items-center gap-2 text-slate-700">
                        <MdOutlineBed className="text-xl text-slate-400" />
                        <span className="font-medium">{property.bedrooms} Bed</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MdBathtub className="text-xl text-slate-400" />
                        <span className="font-medium">{property.bathrooms} Bath</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MdSquareFoot className="text-xl text-slate-400" />
                        <span className="font-medium">{property.square_meters} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <MdCalendarToday className="text-xl text-slate-400" />
                        <span className="font-medium">Available {new Date(property.available_from).toLocaleDateString()}</span>
                      </div>
                   </div>
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
                     {/* TODO: Use icon map helper ideally, for now plain list */}
                     {property.amenities && property.amenities.map((am, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700">
                         <MdVerified className="text-cyan-500" /> {/* Placeholder icon */}
                         <span className="capitalize">{am.label || am}</span>
                       </div>
                     ))}
                   </div>
                </div>
             </div>

             {/* Sidebar / Host Info */}
             <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
                   <h3 className="text-lg font-bold text-slate-900 mb-6">Meet the Host</h3>
                   
                   <div className="flex items-center gap-4 mb-6">
                      {property.host.avatar ? (
                        <img 
                          src={property.host.avatar} 
                          className="w-16 h-16 rounded-full object-cover bg-slate-100" 
                          alt={property.host.name}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xl font-bold">
                          {property.host.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {property.host.name}
                          {property.host.verified && <MdVerified className="text-cyan-500" title="Verified Host" />}
                        </div>
                        <div className="text-sm text-slate-500">Joined 2024</div>
                      </div>
                   </div>

                   <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]">
                     Contact Host
                   </button>
                   <p className="text-xs text-center text-slate-400 mt-4">
                     Response time: usually within an hour
                   </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
