'use client';

import { 
  DashboardFilters, 
  PropertyGrid, 
  EmptyState, 
  ErrorState,
  FilterPills,
  FilterModal
} from "@/components/dashboard";
import BuddyWidget from "@/components/buddy/BuddyWidget";
import ProfileStrengthWidget from "@/components/dashboard/widgets/ProfileStrengthWidget";
import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function HomeDashboard() {
  const router = useRouter();
  const loadMoreRef = useRef(null);
  const { user } = useAuthContext();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const { 
    properties, 
    loading, 
    error, 
    hasMore,
    loadNextPage,
    refresh,
    filters,
    updateFilters
  } = usePropertiesWithFilters({
    autoFetch: true,
    debounceMs: 300
  });

  const handleFilterChange = (key, value) => {
    if (key === 'priceRange') {
        updateFilters({ minPrice: value.min, maxPrice: value.max });
    } else {
        updateFilters({ [key]: value });
    }
  };

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
    <div className="flex min-h-screen bg-navy-50">
      <div className="flex-1 min-w-0">
        <main className="p-4 lg:p-8 w-full max-w-[1920px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
            
            {/* Center Feed (and Mobile Header) */}
            <div className="lg:col-span-8 xl:col-span-9 min-w-0">
                <div className="sticky top-0 z-30 bg-navy-50/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 transition-all">
                    <FilterPills onOpenFilters={() => setIsFilterModalOpen(true)} />
                    <div className="h-px bg-navy-200 mt-2 lg:hidden" />
                </div>

                <div className="mb-6 hidden lg:block">
                    <DashboardFilters />
                </div>

                <FilterModal 
                    isOpen={isFilterModalOpen} 
                    onClose={() => setIsFilterModalOpen(false)} 
                />

                {error && <ErrorState error={error} onRetry={refresh} />}

                {!loading && properties.length === 0 && !error && (
                    <EmptyState 
                        onReset={() => updateFilters({})} 
                        location={filters.location}
                    />
                )}

                <PropertyGrid 
                    properties={properties} 
                    loading={loading} 
                    onSelect={(id) => router.push(`/listings/${id}`)}
                />

                {hasMore && (
                    <div ref={loadMoreRef} className="h-24 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-terracotta-100 border-t-terracotta-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Right Sidebar (Desktop Only) - Sticky & Independent */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-navy-200">
                <ProfileStrengthWidget />
                
                {/* Compact version of Buddy Invite for sidebar */}
                <div>
                     <BuddyWidget compact={true} />
                </div>

                {/* Placeholder for future "Similar Listings" or "Community Events" */}
                <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all border border-navy-700">
                     <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-1 text-white">Find your tribe?</h3>
                        <p className="text-navy-200 text-sm mb-4">Join 12,000+ others in the community chat.</p>
                        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-bold transition-colors text-white border border-white/10">Join Community</button>
                     </div>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}