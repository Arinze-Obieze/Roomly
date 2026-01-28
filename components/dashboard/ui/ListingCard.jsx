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
      className="group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image 
          src={imgSrc || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'} 
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 ${data.isBlurry ? 'blur-2xl scale-110 grayscale-[0.2]' : 'group-hover:scale-105'}`}
          priority={false}
          onError={() => setImgSrc('https://placehold.co/600x400/e2e8f0/64748b?text=Image+Error')}
        />
        
        {/* Actions - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {!isOwner && !data.isBlurry && (
            <button 
                onClick={handleSave}
                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors active:scale-95"
            >
                {isSaved ? (
                <MdFavorite className="text-red-500 text-xl" />
                ) : (
                <MdFavoriteBorder className="text-slate-600 text-xl" />
                )}
            </button>
            )}

            {!isOwner && !data.isBlurry && (
             <button 
                onClick={handleShare}
                disabled={sharing}
                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors active:scale-95 text-slate-600 hover:text-cyan-600"
                title="Share to Buddy Group"
            >
                {sharing ? (
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-cyan-500 rounded-full animate-spin" />
                ) : (
                    <MdGroupAdd className="text-xl" />
                )}
            </button>
            )}
        </div>

        {/* Private Badge */}
        {data.isPrivate && (
           <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-xs z-10 font-bold uppercase tracking-wider">
             <MdLock /> Private
           </div>
        )}

        {/* Match Score or Profile Prompt - Top Left */}
        {/* ... (rest of code) ... */}
        {!isOwner && !data.isBlurry && (
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
      </div>

      <div className="p-4">
        {/* Price & Title Row */}
        <div className="flex justify-between items-start mb-1">
           <div className="flex items-baseline gap-1">
             <span className="text-lg font-bold text-slate-900">{data.price}</span>
             <span className="text-sm text-slate-500 font-medium">/{data.period === 'monthly' ? 'mo' : data.period}</span>
           </div>
           {/* Rating or New badge could go here */}
        </div>
        
        <h3 className="font-semibold text-slate-700 text-sm mb-2 line-clamp-1">{data.title}</h3>

        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
            <MdLocationOn className="text-cyan-500 shrink-0" size={14} />
            <span className="truncate">{data.location}</span>
        </div>

        {data.isBlurry ? (
            /* Interest UI for Private Listings */
            <div className="mt-3">
                <button
                    onClick={handleShowInterest}
                    disabled={interestLoading || data.interestStatus === 'pending'}
                    className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98] ${
                        data.interestStatus === 'pending'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-600/20'
                    }`}
                >
                    {data.interestStatus === 'pending' ? (
                        <>
                            <MdCheckCircle className="text-base" />
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
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
               {/* Amenities/Icons */}
                <div className="flex gap-3 text-slate-500">
                    {data.amenities?.slice(0, 3).map((am, i) => {
                        const IconComponent = am.icon; 
                        return (
                        <div key={i} className="flex items-center gap-1 text-xs" title={am.label}>
                            {IconComponent && typeof IconComponent !== 'string' && <IconComponent size={14} />} 
                            <span className="hidden sm:inline">{am.value || ''}</span>
                        </div>
                        );
                    })}
                </div>

                {/* Simple Author Avatar */}
                <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-full transition-colors -mr-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (data.host?.id && !data.isBlurry) {
                            router.push(`/users/${data.host.id}`);
                        }
                    }} 
                >
                    {data.host.avatar ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-100">
                        <Image 
                        src={data.host.avatar} 
                        alt={data.host.name}
                        fill
                        sizes="24px"
                        className="object-cover"
                        />
                    </div>
                    ) : (
                    <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold ring-1 ring-slate-100">
                        {data.host.name?.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    )}
                    <span className="text-xs font-medium text-slate-500 max-w-[60px] truncate">
                    {isOwner ? 'You' : data.host.name?.split(' ')[0]}
                    </span>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};