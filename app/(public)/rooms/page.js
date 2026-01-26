'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";

// New Components
import PublicHeader from "@/components/public/PublicHeader";
import SearchHero from "@/components/public/SearchHero";
import FilterBar from "@/components/public/FilterBar";

// UI Components
import { PropertyGrid, ErrorState } from "@/components/dashboard";
import { MdRefresh } from "react-icons/md";

export default function RoomsPage() {
  const router = useRouter();
  const loadMoreRef = useRef(null);
  
  const { 
    properties, 
    loading, 
    error, 
    hasMore,
    filters,
    updateFilters,
    loadNextPage,
    refresh 
  } = usePropertiesWithFilters({
    autoFetch: true,
    debounceMs: 300,
    initialFilters: {
        priceRange: 'all',
        propertyType: 'any',
        bedrooms: [],
        verifiedOnly: false
    }
  });

  // Handle Search Hero
  const handleLocationSearch = (location) => {
    updateFilters({ location });
    // Scroll to listings
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Filter Bar
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  // Infinite scroll
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      
      <SearchHero onSearch={handleLocationSearch} />

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <main id="listings" className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12">
        
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
                {loading && properties.length === 0 ? 'Searching...' : 
                 properties.length > 0 ? `Properties in Ireland` : 'No results found'}
            </h2>
            <div className="text-sm text-slate-500 font-medium">
                {properties.length} results
            </div>
        </div>

        {error && <ErrorState error={error} onRetry={refresh} />}

        {!loading && properties.length === 0 && !error ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
               <MdRefresh size={40} className="text-slate-400" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
             <p className="text-slate-500 mb-8 max-w-md">
               We couldn't find any matches for your current filters. Try adjusting your search criteria.
             </p>
             <button 
               onClick={() => updateFilters({ 
                 priceRange: 'all', 
                 propertyType: 'any', 
                 bedrooms: [], 
                 location: '' 
                })}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
             >
               Reset Filters
             </button>
           </div>
        ) : (
             <PropertyGrid 
               properties={properties} 
               loading={loading} 
               onSelect={(id) => router.push(`/rooms/${id}`)}
             />
        )}

        {hasMore && (
           <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
             {loading && <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin"></div>}
           </div>
        )}
      </main>
      
      {/* Footer Placeholder for completeness */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
         <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>&copy; 2024 Roomly. Made for Ireland.</p>
         </div>
      </footer>
    </div>
  );
}
