'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MdCheck, MdClose, MdMessage, MdHome } from 'react-icons/md';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReceivedInterestsTab({ interests, onUpdate }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdate = async (id, status) => {
    try {
      setUpdatingId(id);
      const res = await fetch('/api/interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: id, status }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to update status');
      
      toast.success(status === 'accepted' ? 'Interest accepted!' : 'Interest declined');
      onUpdate(); // refresh the parent list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!interests || interests.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-navy-500">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
          <MdHome className="text-3xl text-navy-300" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">No requests yet</h3>
        <p className="mt-1 max-w-sm mx-auto">When seekers show interest in your private listings, they will appear here.</p>
      </div>
    );
  }

  // Groups
  const pending = interests.filter(i => i.status === 'pending');
  const past = interests.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h3 className="uppercase tracking-wider text-xs font-bold text-navy-500 mb-4 px-1">Needs Review</h3>
          <div className="space-y-4">
            {pending.map(item => (
              <InterestCard 
                key={item.id} 
                item={item} 
                isUpdating={updatingId === item.id}
                onAccept={() => handleUpdate(item.id, 'accepted')}
                onReject={() => handleUpdate(item.id, 'rejected')}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="uppercase tracking-wider text-xs font-bold text-navy-500 mb-4 px-1">Past Requests</h3>
          <div className="space-y-4">
            {past.map(item => (
              <InterestCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InterestCard({ item, isUpdating, onAccept, onReject }) {
  const isPending = item.status === 'pending';
  const isAccepted = item.status === 'accepted';
  const isRejected = item.status === 'rejected';

  return (
    <div className="bg-white p-4 lg:p-5 rounded-2xl border border-navy-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        
        {/* Seeker Profile Info */}
        <div className="flex gap-4 min-w-[240px]">
          <Link href={`/users/${item.seeker?.id}`} className="shrink-0">
            {item.seeker?.profile_picture ? (
              <img 
                src={item.seeker.profile_picture} 
                alt="Avatar" 
                className="w-14 h-14 rounded-full object-cover border border-navy-100 hover:opacity-90"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-terracotta-100 flex items-center justify-center text-terracotta-700 font-bold text-lg border border-terracotta-200">
                {item.seeker?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </Link>
          <div>
            <Link href={`/users/${item.seeker?.id}`} className="font-bold text-navy-950 hover:text-terracotta-600 transition-colors">
              {item.seeker?.full_name || 'Anonymous Seeker'}
            </Link>
            <div className="text-sm text-navy-500 mt-0.5 capitalize">
              {item.seeker?.gender || 'Unknown'} • {item.seeker?.occupation || 'Unknown'}
            </div>
            {item.compatibility_score && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold border border-emerald-100">
                ⭐ {item.compatibility_score}% Match
              </div>
            )}
          </div>
        </div>

        {/* Property & Request Info */}
        <div className="flex-1 md:border-l border-navy-100 md:pl-5 w-full">
          <div className="flex justify-between items-start mb-2 gap-4">
            <div>
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Property</p>
              <Link href={`/listings/${item.property?.id}`} className="font-semibold text-navy-800 hover:text-navy-950 line-clamp-1 truncate">
                {item.property?.title || 'Unknown Property'}
              </Link>
            </div>
            <div className="text-xs text-navy-400 whitespace-nowrap">
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {item.message && (
            <div className="mt-3 bg-navy-50 rounded-lg p-3 text-sm text-navy-700 italic border border-navy-100 break-words">
              "{item.message}"
            </div>
          )}
        </div>

        {/* Actions / Status */}
        <div className="w-full md:w-auto shrink-0 flex items-center md:flex-col justify-end gap-3 mt-4 md:mt-0">
          {isPending && (
            <>
              <button 
                onClick={onAccept}
                disabled={isUpdating}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-950 text-white font-bold text-sm rounded-lg hover:bg-navy-800 transition-colors active:scale-95 disabled:opacity-50"
              >
                <MdCheck className="text-lg" /> Accept
              </button>
              <button 
                onClick={onReject}
                disabled={isUpdating}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-navy-600 font-bold text-sm rounded-lg border border-navy-200 hover:bg-navy-50 transition-colors active:scale-95 disabled:opacity-50"
              >
                <MdClose className="text-lg" /> Decline
              </button>
            </>
          )}

          {isAccepted && (
            <>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs uppercase tracking-wider rounded-md border border-emerald-100 mb-2 invisible md:visible">
                Accepted
              </div>
              <Link 
                href={`/messages?user=${item.seeker?.id}&propertyId=${item.property?.id}`}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-terracotta-50 text-terracotta-600 font-bold text-sm rounded-lg hover:bg-terracotta-100 transition-colors active:scale-95 border border-terracotta-100"
              >
                <MdMessage className="text-lg" /> Chat
              </Link>
            </>
          )}

          {isRejected && (
            <div className="px-3 py-1 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider rounded-md border border-red-100">
              Declined
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
