"use client";

import {  FilterModal, ListingCard } from "@/components/dashboard";
import { listings } from "@/data/listings";
import { useState } from "react";

export default function HomeDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  return (
    <>
      <FilterModal
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
      />

      {/* Welcome Section */}
      <div className="hidden lg:block bg-slate-50 border-b border-slate-200 xl:border-none">
        <div className="px-8 py-6 max-w-6xl mx-auto xl:mx-0 xl:px-12">
          <h2 className="text-xl font-semibold mb-1">Good morning, Alex 👋</h2>
          <p className="text-slate-500 text-sm">Based on your filters, we found 12 great matches in Dublin.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 xl:px-12 pb-24 lg:pb-8 pt-4 lg:pt-8">
        <div className="max-w-6xl mx-auto xl:mx-0">
          {/* Filter Pills */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide mx-4 px-4 lg:mx-0 lg:px-0">
            {["All", "Recommended", "New", "Verified", "Pets"].map((filter, i) => (
              <button 
                key={i} 
                className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${i === 0 ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
            {listings.map((listing) => (
              <ListingCard 
                key={listing.id} 
                data={listing}
                onSelect={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}