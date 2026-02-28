'use client';

import { useAuthContext } from "@/core/contexts/AuthContext";
import { useSavedProperties } from "@/core/contexts/SavedPropertiesContext";
import { createClient } from "@/core/utils/supabase/client";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import GlobalSpinner from '@/components/ui/GlobalSpinner';
import { 
  MdLocationOn, 
  MdFavorite, 
  MdFavoriteBorder, 
  MdLock, 
  MdCheckCircle,
  MdGroupAdd,
  MdBolt,
  MdGroup
} from "react-icons/md";

export const ListingCard = memo(function ListingCard({ data, onSelect }) {
  const router = useRouter();
  const { user, openLoginModal } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const isOwner = user?.id === data.host?.id;
  
  const isSaved = isPropertySaved(data.id);
  const [imgSrc, setImgSrc] = useState(data.image);
  const [interestLoading, setInterestLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const priceLabel = useMemo(() => {
    if (data.isBlurry && data.priceRange) {
      return data.priceRange;
    }

    if (typeof data.price === 'number' && Number.isFinite(data.price)) {
      return `€${data.price.toLocaleString('en-IE')}`;
    }

    if (typeof data.price === 'string') {
      const trimmed = data.price.trim();
      if (!trimmed) return '€0';

      const numeric = Number(trimmed.replace(/[^\d.]/g, ''));
      if (Number.isFinite(numeric) && numeric > 0) {
        return `€${numeric.toLocaleString('en-IE')}`;
      }

      return trimmed.startsWith('€') ? trimmed : `€${trimmed}`;
    }

    return '€0';
  }, [data.isBlurry, data.price, data.priceRange]);

  useEffect(() => {
    setImgSrc(data.image);
  }, [data.image]);

  const handleSave = useCallback((e) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal('You need an account to save/favorite a room.');
      return;
    }
    toggleSave(data.id);
  }, [data.id, openLoginModal, toggleSave, user]);

  const handleShare = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) {
        openLoginModal('Sign up to share properties with friends.');
        return;
    }

    setSharing(true);
    try {
        const supabase = createClient();
        
        const { data: member } = await supabase
            .from('buddy_group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (!member) {
            toast('Create or join a buddy group to share rooms!', { icon: '👋' });
            return;
        }

        // Fetch CSRF token — required by the buddy messages API
        const csrfRes = await fetch('/api/csrf-token');
        const { csrfToken } = await csrfRes.json();

        const res = await fetch('/api/buddy/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
                groupId: member.group_id,
                content: `Check out this room: ${data.title}`,
                attachmentType: 'property',
                attachmentData: {
                    id: data.id,
                    title: data.title,
                    price: priceLabel,
                    image: data.image,
                    location: data.location
                }
            })
        });

        if (res.ok) {
            toast.success('Shared to group chat!');
            router.push('/dashboard/buddy');
        } else {
            const payload = await res.json();
            throw new Error(payload.error || 'Failed to share');
        }

    } catch (error) {
        console.error(error);
        toast.error('Failed to share');
    } finally {
        setSharing(false);
    }
  }, [data.id, data.image, data.location, data.title, openLoginModal, priceLabel, router, user]);

  const handleShowInterest = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) {
      openLoginModal('Sign up to show interest in this private listing.');
      return;
    }

    try {
      setInterestLoading(true);
      const response = await fetch(`/api/properties/${data.id}/interest`, {
        method: 'POST'
      });
      const resData = await response.json();

      if (resData.success) {
        toast.success(resData.message || 'Interest sent! Landlord will be notified.');
      } else {
        toast.error(resData.error || 'Failed to send interest');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setInterestLoading(false);
    }
  }, [data.id, openLoginModal, user]);

  return (
    <div 
      onClick={() => onSelect?.()}
      className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-navy-950/5 hover:-translate-y-1 border border-navy-200 flex flex-col h-full [content-visibility:auto] [contain-intrinsic-size:420px]"
    >
      {/* Image Container */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-navy-100">
        <Image 
          src={imgSrc || 'https://placehold.co/600x400/navy-100/navy-500?text=No+Image'} 
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 ${data.isBlurry ? 'blur-2xl scale-110 grayscale-[0.2]' : 'group-hover:scale-105'}`}
          priority={false}
          onError={() => setImgSrc('https://placehold.co/600x400/navy-100/navy-500?text=Image+Error')}
        />
        
        {/* Gradients using Navy system */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-navy-900/40 to-transparent opacity-80"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-900/60 via-navy-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10 max-w-[80%]">
             {data.isPrivate && (
                <div className="bg-navy-900/90 text-white px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border border-white/10">
                    <MdLock className="text-terracotta-500" /> Private
                </div>
             )}
             
        </div>

        {/* Match Score */}
        {!isOwner && !data.isBlurry && !data.isPrivate && (
            <div className="absolute bottom-3 left-3 z-10 transition-transform duration-300 group-hover:-translate-y-1">
                {user && data.matchScore !== null ? (
                    <div className="bg-white/95 backdrop-blur-md text-navy-900 pl-2 pr-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold border border-navy-200">
                        <div className="relative w-4 h-4">
                             <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path className="text-navy-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className={`${data.matchScore > 85 ? 'text-teal-500' : data.matchScore > 50 ? 'text-yellow-400' : 'text-terracotta-500'}`} strokeDasharray={`${data.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                             </svg>
                        </div>
                        <span>{data.matchScore}% Match</span>
                    </div>
                ) : (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!user) openLoginModal('Sign up to see compatibility match.');
                        }}
                        className="bg-navy-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold border border-white/10 hover:bg-navy-900 transition-colors"
                    >
                         Sign up to see match
                    </div>
                )}
            </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {!data.isBlurry && (
            <>
                <button 
                    onClick={handleSave}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-navy-400 hover:text-terracotta-500 transition-all active:scale-90"
                >
                    {isSaved ? <MdFavorite className="text-terracotta-500 text-base" /> : <MdFavoriteBorder className="text-base" />}
                </button>
                
                <button 
                    onClick={handleShare}
                    disabled={sharing}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-navy-400 hover:text-navy-950 transition-all active:scale-90"
                >
                    {sharing ? <GlobalSpinner size="sm" color="slate" /> : <MdGroupAdd className="text-base" />}
                </button>
            </>
            )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Title & Price */}
        <div className="flex justify-between items-start gap-2 mb-2">
           <h3 className="font-heading font-bold text-navy-950 text-base leading-tight line-clamp-2 group-hover:text-terracotta-600 transition-colors flex-1">
             {data.title}
           </h3>
           <div className="flex flex-col items-end shrink-0">
             <span className="text-xl font-extrabold text-terracotta-600">{priceLabel}</span>
             <span className="text-[10px] text-navy-500 font-medium uppercase tracking-wide">{data.period === 'monthly' ? 'per month' : data.period}</span>
           </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-navy-500 text-sm mb-4">
            <MdLocationOn className="text-terracotta-400 shrink-0" size={16} />
            <span className="truncate">{data.location}</span>
        </div>

        {/* Smart Badges */}
        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
            {data.bills_option === 'included' && (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-600 text-[10px] uppercase tracking-wide px-2 py-1 rounded-md font-bold border border-teal-100">
                    <MdBolt size={12} /> Bills Inc.
                </span>
            )}
            {data.couples_allowed && (
                <span className="inline-flex items-center gap-1 bg-navy-50 text-navy-700 text-[10px] uppercase tracking-wide px-2 py-1 rounded-md font-bold border border-navy-200">
                    <MdGroup size={12} /> Couples
                </span>
            )}
        </div>

        {/* Footer */}
        {!data.isBlurry && (
             <div className="pt-3 border-t border-navy-200 flex items-center justify-between text-xs text-navy-500">
                <div className="flex gap-3">
                    {data.amenities?.slice(0, 3).map((am, i) => {
                        const IconComponent = am.icon; 
                        return (
                            <div key={i} className="flex items-center gap-1" title={am.label}>
                                {IconComponent && typeof IconComponent !== 'string' && <IconComponent size={14} className="text-navy-500" />} 
                                <span className="max-w-[60px] truncate">{am.value}</span>
                            </div>
                        );
                    })}
                </div>
                
                {data.host?.avatar ? (
                     <div className="relative w-6 h-6 rounded-full overflow-hidden bg-navy-100 ring-1 ring-navy-200">
                        <Image src={data.host.avatar} alt="Host" fill className="object-cover" sizes="24px" />
                     </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-terracotta-50 text-terracotta-600 flex items-center justify-center text-[10px] font-bold ring-1 ring-terracotta-100">
                        {data.host?.name?.[0] || '?'}
                    </div>
                )}
             </div>
        )}

        {/* Blur State Action */}
        {data.isBlurry && (
            <div className="mt-2">
                 <button
                    onClick={handleShowInterest}
                    disabled={interestLoading || data.interestStatus === 'pending'}
                    className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] ${
                        data.interestStatus === 'pending'
                        ? 'bg-teal-50 text-teal-600 border border-teal-100 cursor-default'
                        : 'bg-navy-950 text-white hover:bg-navy-900 shadow-lg shadow-navy-950/20'
                    }`}
                >
                    {data.interestStatus === 'pending' ? (
                        <>
                            <MdCheckCircle className="text-teal-500" size={16} />
                            Interest Sent
                        </>
                    ) : (
                        'Show Interest'
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
});
