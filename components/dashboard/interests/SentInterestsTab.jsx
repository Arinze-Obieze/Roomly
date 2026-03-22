'use client';

import { MdMessage, MdHome, MdOutlineHourglassEmpty, MdClose } from 'react-icons/md';
import Link from 'next/link';

export default function SentInterestsTab({ interests }) {
  if (!interests || interests.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-navy-500">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
          <MdHome className="text-3xl text-navy-300" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">No interests sent</h3>
        <p className="mt-1 max-w-sm mx-auto">When you show interest in properties, they will appear here so you can track their status.</p>
        <Link href="/dashboard" className="inline-block mt-6 font-bold text-terracotta-600 hover:underline">
          Browse Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interests.map(item => (
        <SentInterestCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function SentInterestCard({ item }) {
  const isPending = item.status === 'pending';
  const isAccepted = item.status === 'accepted';
  const isRejected = item.status === 'rejected';

  return (
    <div className="bg-white p-4 lg:p-5 rounded-2xl border border-navy-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Property Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-navy-950 truncate">
              {item.property?.title || 'Unknown Property'}
            </h3>
            {isPending && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                <MdOutlineHourglassEmpty /> Pending
              </span>
            )}
            {isAccepted && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                Approved
              </span>
            )}
            {isRejected && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                <MdClose /> Declined
              </span>
            )}
          </div>
          <p className="text-sm text-navy-500">
            {item.property?.city}, {item.property?.state} • €{item.property?.price_per_month}/month
          </p>
          <div className="text-xs text-navy-400 mt-2">
            Applied on {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end gap-3 mt-2 sm:mt-0">
          <Link 
            href={`/listings/${item.property?.id}`}
            className="flex-1 sm:flex-none text-center px-4 py-2 bg-white text-navy-600 font-bold text-sm rounded-xl border border-navy-200 hover:bg-navy-50 transition-colors"
          >
            View Listing
          </Link>
          
          {isAccepted && (
            <Link 
              href={`/messages?user=${item.property?.listed_by_user_id}&propertyId=${item.property?.id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-950 text-white font-bold text-sm rounded-xl hover:bg-navy-800 transition-colors shadow-sm"
            >
              <MdMessage className="text-lg" /> Chat Host
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
