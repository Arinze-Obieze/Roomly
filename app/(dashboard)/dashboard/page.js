"use client";

import { FilterModal, ListingCard } from "@/components/dashboard";
import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
import { useState, useEffect, useRef } from "react";
import { MdRefresh } from "react-icons/md";
import { useAuthContext } from "@/contexts/AuthContext";

export default function HomeDashboard() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const loadMoreRef = useRef(null);
  const { user } = useAuthContext();
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  const { 
    properties, 
    loading, 
    error, 
    hasMore,
    loadNextPage,
    refresh 
  } = usePropertiesWithFilters({
    autoFetch: true,
    debounceMs: 300
  });

  // Infinite scroll implementation
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, loadNextPage]);

  return (
    <>
      <FilterModal
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
      />

      {/* Welcome Section */}
      <div className="hidden lg:block bg-slate-50 border-b border-slate-200 xl:border-none">
        <div className="px-8 py-6 max-w-6xl mx-auto xl:mx-0 xl:px-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Good morning, {firstName} 👋</h2>
              <p className="text-slate-500 text-sm">
                {loading && properties.length === 0 
                  ? "Loading properties..." 
                  : `We found ${properties.length} great matches in Dublin.`}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <MdRefresh className={loading ? "animate-spin" : ""} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
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
                className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  i === 0 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
              <button
                onClick={refresh}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && properties.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties found</h3>
              <p className="text-slate-600 text-sm mb-4">Try adjusting your filters to see more results</p>
              <button
                onClick={() => setShowFilters(true)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Adjust Filters
              </button>
            </div>
          )}

          {/* Listings Grid */}
          {properties.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
              {properties.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  data={listing}
                  onSelect={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && properties.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="h-56 bg-slate-200"></div>
                  <div className="p-5">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 text-center">
              {loading && properties.length > 0 && (
                <div className="inline-flex items-center gap-2 text-slate-600">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Loading more properties...</span>
                </div>
              )}
            </div>
          )}

          {/* End of Results */}
          {!hasMore && properties.length > 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              You've reached the end of the results
            </div>
          )}
        </div>
      </div>
    </>
  );
}