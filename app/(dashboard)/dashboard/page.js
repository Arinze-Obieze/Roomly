'use client'
import { FilterModal, ListingCard } from "@/components/dashboard";
import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { MdRefresh } from "react-icons/md";
import { useAuthContext } from "@/contexts/AuthContext";

export default function HomeDashboard() {
  const router = useRouter();
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
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Mobile Filter Modal */}
      <FilterModal
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
      />

      <div className="flex-1 min-w-0">
        {/* Welcome Section */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 lg:static lg:z-0">
          <div className="px-4 py-4 lg:px-8 lg:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Good morning, {firstName} 👋</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {loading && properties.length === 0 
                    ? "Loading properties..." 
                    : `We found ${properties.length} matches for you.`}
                </p>
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 lg:px-4 lg:py-2 flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <MdRefresh className={loading ? "animate-spin" : ""} size={20} />
                <span className="hidden lg:inline text-sm font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 lg:p-8">
          {/* Filter Pills (Mobile/Tablet) */}
          <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
               onClick={() => setShowFilters(true)}
               className="shrink-0 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <span>Filters</span>
            </button>
            {["Recommended", "New", "Verified", "Pets"].map((filter, i) => (
              <button 
                key={i} 
                className="shrink-0 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium whitespace-nowrap"
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="text-red-600">⚠️</div>
              <div className="flex-1">
                <p className="text-red-900 font-medium text-sm">Unable to load properties</p>
                <p className="text-red-700 text-xs">{error}</p>
              </div>
              <button onClick={refresh} className="text-sm font-medium text-red-700 underline">Retry</button>
            </div>
          )}

          {/* Empty State */}
          {!loading && properties.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Try adjusting your filters or location to see more results.
              </p>
              <button
                onClick={() => {
                   // Logic to reset filters or open modal
                   setShowFilters(true);
                }}
                className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {properties.map((listing) => (
              <ListingCard 
                key={listing.id} 
                data={listing}
                onSelect={() => router.push(`/listings/${listing.id}`)}
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

          {/* Load More Trigger */}
          {hasMore && (
             <div ref={loadMoreRef} className="h-20" />
          )}
        </main>
      </div>
    </div>
  );
}