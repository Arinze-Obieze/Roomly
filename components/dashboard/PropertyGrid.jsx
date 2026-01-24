'use client';

import { ListingCard } from "./ui/ListingCard";

export default function PropertyGrid({ properties, loading, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((listing) => (
        <ListingCard 
          key={listing.id} 
          data={listing}
          onSelect={() => onSelect(listing.id)}
        />
      ))}
      
      {/* Loading Skeletons */}
      {loading && (
        [...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-[400px] animate-pulse">
            <div className="h-48 bg-slate-100" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded mt-4" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
