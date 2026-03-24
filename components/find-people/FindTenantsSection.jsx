'use client';

import { MdLocationOn, MdLock } from 'react-icons/md';
import FindPeoplePagination from './FindPeoplePagination';

export default function FindTenantsSection({
  data,
  contactingId,
  onContact,
  onOpenProfile,
  pagination,
  onPageChange,
  isLoading = false,
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-heading font-bold text-navy-950">Matched Tenants</h2>
          <p className="text-sm text-navy-500">Browse seekers ranked against your approved listings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.map((seeker) => (
          <article key={seeker.user_id} className="bg-white border border-navy-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:shadow-navy-950/5 transition-all">
            <div className="flex items-start justify-between gap-3 mb-4">
              <button
                type="button"
                onClick={() => !seeker.isBlurry && onOpenProfile(seeker.user_id)}
                className={`flex items-center gap-3 min-w-0 text-left ${!seeker.isBlurry ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              >
                <div className="relative w-12 h-12 rounded-full bg-navy-50 overflow-hidden shrink-0">
                  {seeker.profile_picture ? (
                    <img
                      src={seeker.profile_picture}
                      alt={seeker.full_name}
                      className={`w-full h-full object-cover transition-all ${seeker.isBlurry ? 'blur-md scale-110 saturate-50' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy-500 font-heading font-bold">
                      {seeker.full_name?.[0] || '?'}
                    </div>
                  )}
                  {seeker.isBlurry && (
                    <div className="absolute inset-0 bg-navy-950/20 flex items-center justify-center">
                      <MdLock className="text-white drop-shadow-md" size={14} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-navy-950 truncate flex items-center gap-1.5">
                    <span className="truncate">{seeker.full_name}</span>
                    {seeker.isBlurry && (
                      <span className="bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">Private</span>
                    )}
                  </h3>
                  {seeker.current_city && (
                    <div className="text-xs text-navy-500 flex items-center gap-1 mt-0.5">
                      <MdLocationOn size={13} className="text-navy-400" />
                      {seeker.isBlurry ? seeker.current_city.split(',')[0] : seeker.current_city}
                    </div>
                  )}
                </div>
              </button>

              <div className="bg-teal-50 text-teal-700 border border-teal-100 rounded-xl px-2.5 py-1 text-xs font-heading font-bold shrink-0">
                {seeker.match_score}% Match
              </div>
            </div>

            {seeker.bio && (
              <p className="text-sm text-navy-600 line-clamp-2 mb-3">{seeker.bio}</p>
            )}

            {seeker.matched_property?.title && (
              <div className="mb-3 text-xs text-navy-600 bg-navy-50 border border-navy-100 rounded-xl p-2.5">
                Best fit for your listing:{' '}
                <span className="font-heading font-semibold text-navy-950">{seeker.matched_property.title}</span>
              </div>
            )}

            {Array.isArray(seeker.interests) && seeker.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {seeker.interests.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg bg-navy-50 text-navy-700 border border-navy-100 text-[11px] font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onContact(seeker)}
              disabled={contactingId === seeker.user_id}
              className="w-full bg-terracotta-500 text-white py-2.5 rounded-xl text-sm font-heading font-semibold hover:bg-terracotta-600 transition-colors disabled:opacity-60 shadow-lg shadow-terracotta-500/10 mt-auto"
            >
              {contactingId === seeker.user_id ? 'Sending...' : 'Contact Seeker'}
            </button>
          </article>
        ))}
      </div>

      <FindPeoplePagination
        pagination={pagination}
        onPageChange={onPageChange}
        isLoading={isLoading}
      />
    </section>
  );
}
