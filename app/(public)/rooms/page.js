'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePropertiesWithFilters } from "@/core/hooks/usePropertiesWithFilters";

// New Components
import Navbar from "@/components/marketing/Navbar";
// import SearchHero from "@/components/public/SearchHero"; // Removed as FilterBar now handles search
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
    debounceMs: 300
  });

  const handleFilterChange = (key, value) => {
    // If key is object (like priceRange), it spreads. 
    // If value is object (like {min, max}), we might want to spread it or keep as object property?
    // Backend expects: minPrice, maxPrice, bedrooms, propertyType, etc.
    // FilterBar sends: 'priceRange' -> {min, max}
    // We need to map these to the flat structure expected by useProperties/API usually, 
    // OR updateFilters handles it.
    // Let's look at FilterContext default filters: it has `priceRange: 'all'` usually.
    // But now we want support for min/max.
    
    // Let's flatten the updates here to match typical query params if needed, 
    // or assume Context handles object values.
    // Given the previous `priceRange` was a string 'all'|'budget', we are changing it to numbers.
    
    if (key === 'priceRange') {
        updateFilters({ minPrice: value.min, maxPrice: value.max });
    } else {
        updateFilters({ [key]: value });
    }
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
      <Navbar />
      
      {/* Search Hero removed/replaced by a spacer or smaller header if needed? 
          The previous SearchHero was big and beautiful. 
          The new FilterBar is sticky. 
          If we remove SearchHero, the page might look empty at top. 
          Proposal: Keep SearchHero but hide its internal search box? 
          OR just have the FilterBar overlaid on a hero image?
          The user "Unified Filter Bar" usually implies it IS the hero search.
          Let's try to keep a visual hero background but place the FilterBar prominently.
          Actually, the user said "look at how the properties are uploaded... suggest filters".
          And "In price range use slider...".
          And "Unified Filter Bar UI Design".
          
          Let's place the FilterBar *over* a Hero section or just at the top.
          For now, I will render a simple "Find your home" header background and the filter bar below/over it.
      */}
      
      <div className="bg-slate-900 py-12 px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Find your perfect place
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Browse thousands of rooms and apartments across Ireland
          </p>
      </div>

      <div className="-mt-8"> {/* Negative margin to overlap/pull up */}
         <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      </div>

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
                 minPrice: 0, 
                 maxPrice: 5000, 
                 propertyType: 'any', 
                 bedrooms: [], 
                 bathrooms: 'any',
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
             {loading && <div className="w-8 h-8 border-4 border-slate-200 border-t-terracotta-500 rounded-full animate-spin"></div>}
           </div>
        )}
      </main>
      
      {/* Footer Placeholder for completeness */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
         <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>&copy; 2025 roomfind.ie Made for Ireland.</p>
         </div>
      </footer>
    </div>
  );
}
