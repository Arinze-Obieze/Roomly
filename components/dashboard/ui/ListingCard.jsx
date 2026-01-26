"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MdLocationOn, MdVerified, MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";

export const ListingCard = ({ data, onSelect }) => {
  const router = useRouter();
  const { user, openLoginModal } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const isOwner = user?.id === data.host?.id;
  
  const isSaved = isPropertySaved(data.id);
  const [imgSrc, setImgSrc] = useState(data.image);

  useEffect(() => {
    setImgSrc(data.image);
  }, [data.image]);

  const handleSave = (e) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal('You need an account to save/favorite a room.');
      return;
    }
    toggleSave(data.id);
  };

  return (
    <div 
      onClick={() => onSelect?.()}
      className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative h-48 md:h-52 lg:h-56 w-full overflow-hidden">
        <Image 
          src={imgSrc || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'} 
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={false}
          onError={() => setImgSrc('https://placehold.co/600x400/e2e8f0/64748b?text=Image+Error')}
        />
        
        {/* Save Button - Top Right */}
        {!isOwner && (
          <button 
            onClick={handleSave}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-md z-10 hover:bg-white transition-colors active:scale-95"
          >
            {isSaved ? (
              <MdFavorite className="text-red-500 text-xl" />
            ) : (
              <MdFavoriteBorder className="text-slate-600 text-xl" />
            )}
          </button>
        )}

        {/* Match Score or Profile Prompt - Top Left */}
        {!isOwner && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            {user && data.matchScore !== null ? (
               <div className="bg-white/90 backdrop-blur text-slate-900 px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs">
                 <div className={`w-1.5 h-1.5 rounded-full ${data.matchScore > 85 ? 'bg-green-500' : data.matchScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                 <span className="font-bold">{data.matchScore}% Match</span>
               </div>
            ) : (
               <div 
                 onClick={(e) => {
                   e.stopPropagation();
                   if (!user) {
                     openLoginModal('Sign up to see compatibility match.');
                     return;
                   }
                   router.push('/profile?tab=preferences');
                 }}
                 className="bg-cyan-600/90 backdrop-blur text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs hover:bg-cyan-700 transition-colors cursor-pointer"
               >
                 <span className="font-bold whitespace-nowrap">{user ? 'Complete Profile to View Match' : 'Sign up to see compatibility'}</span>
               </div>
            )}
          </div>
        )}

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-xl">
          <span className="font-bold text-sm lg:text-base">{data.price}</span>
          <span className="text-xs opacity-80">/{data.period}</span>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="mb-2">
          <h3 className="font-bold text-base lg:text-lg text-slate-900 mb-1 line-clamp-1">{data.title}</h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm">
            <MdLocationOn className="text-cyan-500 shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 my-3">
          {data.amenities.slice(0, 2).map((am, i) => {
            // am.icon is now the component itself from data/amenities.js
            const IconComponent = am.icon; 
            return (
              <div key={i} className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
                {IconComponent && <IconComponent size={12} />} {am.label}
              </div>
            );
          })}
          {data.amenities.length > 2 && (
            <div className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-100">
              +{data.amenities.length - 2}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100 my-3" />

        <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-full transition-colors -ml-1 pr-2"
              onClick={(e) => {
                e.stopPropagation();
                if (data.host?.id) {
                    router.push(`/users/${data.host.id}`);
                }
              }} 
            >
            {data.host.avatar ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100">
                <Image 
                  src={data.host.avatar} 
                  alt={data.host.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold">
                {data.host.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700 truncate">
              {isOwner ? 'You' : data.host.name}
            </span>
            {data.verified && <MdVerified className="text-cyan-500 shrink-0" size={18} title="Verified ID" />}
          </div>
          <button className="text-sm font-semibold text-slate-900 hover:text-cyan-600 transition-colors hidden lg:block">
            Details &rarr;
          </button>
          <button className="text-sm font-semibold text-cyan-600 lg:hidden">
            View
          </button>
        </div>
      </div>
    </div>
  );
};