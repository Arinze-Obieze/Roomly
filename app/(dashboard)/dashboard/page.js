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
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 min-w-0">
        <main className="p-4 lg:p-8 w-full max-w-[1920px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-16 2xl:gap-24 items-start">
            
            {/* Center Feed (and Mobile Header) */}
            <div className="lg:col-span-3 min-w-0">
                <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
                    <FilterPills onOpenFilters={() => setIsFilterModalOpen(true)} />
                    <div className="h-px bg-slate-200 mt-2 lg:hidden" />
                </div>

                <div className="mb-4">
                    <DashboardFilters />
                </div>

                <FilterModal 
                    isOpen={isFilterModalOpen} 
                    onClose={() => setIsFilterModalOpen(false)} 
                />

                {error && <ErrorState error={error} onRetry={refresh} />}

                {!loading && properties.length === 0 && !error && (
                    <EmptyState onReset={() => updateFilters({})} />
                )}

                <PropertyGrid 
                    properties={properties} 
                    loading={loading} 
                    onSelect={(id) => router.push(`/listings/${id}`)}
                />

                {hasMore && (
                    <div ref={loadMoreRef} className="h-20" />
                )}
            </div>

            {/* Right Sidebar (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6 sticky top-24">
                <ProfileStrengthWidget />
                
                {/* Compact version of Buddy Invite for sidebar */}
                <div>
                     <BuddyWidget compact={true} />
                </div>

                {/* Future: Community Events etc */}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}