import { useAuthContext } from "@/contexts/AuthContext";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { MdLocationOn, MdVerified, MdFavorite, MdFavoriteBorder, MdLock, MdCheckCircle, MdGroupAdd } from "react-icons/md";
// ... imports

export const ListingCard = ({ data, onSelect }) => {
  const router = useRouter();
  const { user, openLoginModal } = useAuthContext();
  const { isPropertySaved, toggleSave } = useSavedProperties();
  const isOwner = user?.id === data.host?.id;
  
  const isSaved = isPropertySaved(data.id);
  const [imgSrc, setImgSrc] = useState(data.image);
  const [interestLoading, setInterestLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!user) {
        openLoginModal('Sign up to share properties with friends.');
        return;
    }

    setSharing(true);
    try {
        // 1. Check for active group
        // We do a quick check via API or assume we fetch messages
        // Optimised: Try to send. The API checks membership.
        // But we need groupId.
        // We can fetch user's group first.
        const groupRes = await fetch('/api/buddy/join', { method: 'OPTIONS' }); // Hacky? No, let's just fetch active group from a new helper or assume we know it.
        // Better: Fetch group.
        // Ideally we have this in Context.
        // For now, let's do a quick fetch.
        // Or better: Use global context if available.
        // I will use a direct supabase query here as I have done elsewhere.
        // Wait, ListingCard is client component. I can import createClient.
        const { createClient } = require('@/lib/supabase/client');
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

        // 2. Send Message
        const res = await fetch('/api/buddy/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: member.group_id,
                content: `Check out this room: ${data.title}`,
                attachmentType: 'property',
                attachmentData: {
                    id: data.id,
                    title: data.title,
                    price: data.price,
                    image: data.image,
                    location: data.location
                }
            })
        });

        if (res.ok) {
            toast.success('Shared to group chat!');
            router.push('/buddy');
        } else {
            throw new Error('Failed to share');
        }

    } catch (error) {
        console.error(error);
        toast.error('Failed to share');
    } finally {
        setSharing(false);
    }
  };

  const handleShowInterest = async (e) => {
    // ... existing logic
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
  };

  return (
    <div 
      onClick={() => onSelect?.()}
      className="group bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-slate-100"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image 
          src={imgSrc || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'} 
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-transform duration-700 ${data.isBlurry ? 'blur-2xl scale-110 grayscale-[0.2]' : 'group-hover:scale-110'}`}
          priority={false}
          onError={() => setImgSrc('https://placehold.co/600x400/e2e8f0/64748b?text=Image+Error')}
        />
        
        {/* Gradient Overlay for better text visibility if needed */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>

        {/* Actions - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 transition-opacity duration-300">
            {!isOwner && !data.isBlurry && (
            <button 
                onClick={handleSave}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-slate-50 transition-all active:scale-95"
            >
                {isSaved ? (
                <MdFavorite className="text-terracotta-500 text-xl" />
                ) : (
                <MdFavoriteBorder className="text-slate-400 text-xl hover:text-terracotta-500 transition-colors" />
                )}
            </button>
            )}

            {!isOwner && !data.isBlurry && (
             <button 
                onClick={handleShare}
                disabled={sharing}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-slate-50 transition-all active:scale-95 text-slate-400 hover:text-navy-950"
                title="Share to Buddy Group"
            >
                {sharing ? (
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-navy-950 rounded-full animate-spin" />
                ) : (
                    <MdGroupAdd className="text-xl" />
                )}
            </button>
            )}
        </div>

        {/* Private Badge */}
        {data.isPrivate && (
           <div className="absolute top-4 left-4 bg-navy-950 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs z-10 font-bold uppercase tracking-wider backdrop-blur-md bg-opacity-90">
             <MdLock className="text-terracotta-500" /> Private
           </div>
        )}

        {/* Match Score or Profile Prompt - Top Left (if not private) */}
        {!isOwner && !data.isBlurry && !data.isPrivate && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
            {user && data.matchScore !== null ? (
               <div className="bg-white/95 backdrop-blur-sm text-navy-950 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold border border-white/20">
                 <div className={`w-2 h-2 rounded-full ${data.matchScore > 85 ? 'bg-emerald-500' : data.matchScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                 <span>{data.matchScore}% Match</span>
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
                 className="bg-navy-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs hover:bg-navy-800 transition-all cursor-pointer border border-white/10"
               >
                 <span className="font-bold whitespace-nowrap">{user ? 'See Match Score' : 'Sign up to see match'}</span>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Price & Title Row */}
        <div className="flex justify-between items-start mb-2">
           <div className="flex items-baseline gap-1">
             <span className="text-2xl font-extrabold text-navy-950">{data.price}</span>
             <span className="text-sm text-slate-400 font-medium">/{data.period === 'monthly' ? 'mo' : data.period}</span>
           </div>
           
           {/* Verified Badge if applicable (mock logic or prop) */}
           {data.verified && <MdVerified className="text-terracotta-500 text-xl" title="Verified Listing" />}
        </div>
        
        <h3 className="font-bold text-navy-900 text-lg mb-3 line-clamp-1 group-hover:text-terracotta-600 transition-colors">{data.title}</h3>

        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
            <MdLocationOn className="text-terracotta-500 shrink-0" size={16} />
            <span className="truncate font-medium">{data.location}</span>
        </div>

        {data.isBlurry ? (
            /* Interest UI for Private Listings */
            <div className="mt-4">
                <button
                    onClick={handleShowInterest}
                    disabled={interestLoading || data.interestStatus === 'pending'}
                    className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] ${
                        data.interestStatus === 'pending'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                        : 'bg-navy-950 text-white hover:bg-navy-800 shadow-xl shadow-navy-900/20'
                    }`}
                >
                    {data.interestStatus === 'pending' ? (
                        <>
                            <MdCheckCircle className="text-lg" />
                            Interest Sent
                        </>
                    ) : interestLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Show Interest'
                    )}
                </button>
            </div>
        ) : (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
               {/* Amenities/Icons */}
                <div className="flex gap-4 text-slate-400">
                    {data.amenities?.slice(0, 3).map((am, i) => {
                        const IconComponent = am.icon; 
                        return (
                        <div key={i} className="flex items-center gap-1.5 text-xs font-medium" title={am.label}>
                            {IconComponent && typeof IconComponent !== 'string' && <IconComponent size={16} />} 
                            <span className="hidden sm:inline">{am.value || ''}</span>
                        </div>
                        );
                    })}
                </div>

                {/* Simple Author Avatar */}
                <div 
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2 py-1 -mr-2 rounded-full transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.host?.id && !data.isBlurry) {
                            router.push(`/users/${data.host.id}`);
                        }
                    }} 
                >
                    {data.host.avatar ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white shadow-sm">
                        <Image 
                        src={data.host.avatar} 
                        alt={data.host.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                        />
                    </div>
                    ) : (
                    <div className="w-8 h-8 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                        {data.host.name?.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    )}
                    <span className="text-xs font-bold text-navy-900 max-w-[80px] truncate hidden sm:block">
                    {isOwner ? 'You' : data.host.name?.split(' ')[0]}
                    </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};