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
        <p className="mt-1 max-w-sm mx-auto">Property interests and profile interests you send will appear here so you can track their status.</p>
        <Link href="/dashboard" className="inline-block mt-6 font-bold text-terracotta-600 hover:underline">
          Browse Matches
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
  const isPersonInterest = item.interest_category === 'person';
  const counterpart = item.counterpart || null;
  const contextProperty = item.property || null;
  const viewHref = isPersonInterest
    ? (counterpart?.id ? `/users/${counterpart.id}` : '/find-people')
    : `/listings/${contextProperty?.id || item.property?.id}`;
  const chatHref = isAccepted && counterpart?.id
    ? `/messages?user=${counterpart.id}${contextProperty?.id ? `&propertyId=${contextProperty.id}` : ''}`
    : (
      !isPersonInterest && isAccepted && contextProperty?.listed_by_user_id
        ? `/messages?user=${contextProperty.listed_by_user_id}&propertyId=${contextProperty.id}`
        : null
    );
  const title = isPersonInterest
    ? (counterpart?.full_name || 'Private profile match')
    : (contextProperty?.title || item.property?.title || 'Unknown Property');
  const locationBits = [contextProperty?.city || item.property?.city, contextProperty?.state || item.property?.state].filter(Boolean);
  const priceValue = contextProperty?.price_per_month ?? item.property?.price_per_month;
  const subtitle = isPersonInterest
    ? `${counterpart?.gender || 'Unknown'} • ${counterpart?.occupation || 'Unknown'}`
    : `${locationBits.join(', ') || 'Location pending'}${typeof priceValue === 'number' ? ` • €${priceValue}/month` : ''}`;

  return (
    <div className="bg-white p-4 lg:p-5 rounded-2xl border border-navy-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Property Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-navy-950 truncate">
              {title}
            </h3>
            {isPersonInterest && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-50 text-navy-700 text-xs font-bold border border-navy-200">
                Profile
              </span>
            )}
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
            {subtitle}
          </p>
          {isPersonInterest && contextProperty?.title && (
            <div className="text-xs text-navy-400 mt-1">
              Matched via {contextProperty.title}
            </div>
          )}
          {Array.isArray(item.match_reasons) && item.match_reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.match_reasons.slice(0, 3).map((reason) => (
                <span
                  key={reason}
                  className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 text-[11px] font-medium"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-navy-400 mt-2">
            Applied on {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full sm:w-auto shrink-0 flex items-center justify-end gap-3 mt-2 sm:mt-0">
          <Link 
            href={viewHref}
            className="flex-1 sm:flex-none text-center px-4 py-2 bg-white text-navy-600 font-bold text-sm rounded-xl border border-navy-200 hover:bg-navy-50 transition-colors"
          >
            {isPersonInterest ? 'View Profile' : 'View Listing'}
          </Link>
          
          {isAccepted && chatHref && (
            <Link 
              href={chatHref}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-950 text-white font-bold text-sm rounded-xl hover:bg-navy-800 transition-colors shadow-sm"
            >
              <MdMessage className="text-lg" /> Chat
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
