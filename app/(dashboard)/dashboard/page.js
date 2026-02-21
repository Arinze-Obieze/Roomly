'use client';

import { 
  DashboardFilters, 
  PropertyGrid, 
  EmptyState, 
  ErrorState,
  FilterPills,
  FilterModal,
  FilterSidebar
} from "@/components/dashboard";
import BuddyWidget from "@/components/buddy/BuddyWidget";
import ProfileStrengthWidget from "@/components/dashboard/widgets/ProfileStrengthWidget";
import { usePropertiesWithFilters } from "@/core/hooks/usePropertiesWithFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { MdGroups, MdChat } from "react-icons/md";

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
        <main className="px-4 lg:px-8 py-4 lg:py-8 w-full max-md:max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            


            {/* Main Content - Property Grid */}
            <main className="lg:col-span-9 min-w-0">
              {/* Mobile/Tablet Filter Pills */}
              <div className="sticky top-0 z-30 bg-navy-50/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:relative lg:top-0 lg:z-0 lg:bg-transparent lg:backdrop-blur-none lg:pt-0">
                <FilterPills onOpenFilters={() => setIsFilterModalOpen(true)} />
              </div>

              {/* Desktop Filter Tabs */}
              <div className="hidden lg:block mb-6">
                <DashboardFilters />
              </div>

              {/* Filter Modal for Mobile */}
              <FilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)} 
              />

              {/* Error State */}
              {error && <ErrorState error={error} onRetry={refresh} />}

              {/* Empty State */}
              {!loading && properties.length === 0 && !error && (
                <EmptyState 
                  onReset={() => updateFilters({})} 
                  location={filters.location}
                />
              )}

              {/* Property Grid */}
              <PropertyGrid 
                properties={properties} 
                loading={loading} 
                onSelect={(id) => router.push(`/listings/${id}`)}
              />

              {/* Infinite Scroll Loader */}
              {hasMore && (
                <div ref={loadMoreRef} className="h-24 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-navy-200 border-t-terracotta-500 rounded-full animate-spin" />
                </div>
              )}
            </main>

            {/* Right Sidebar - Widgets */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-navy-200 pr-2 space-y-6">
                {/* Profile Strength - Most Important */}
                <ProfileStrengthWidget />
                
                {/* Buddy Group Widget */}
                <BuddyWidget />
                
                {/* Community CTA */}
                <div className="bg-linear-to-br from-navy-800 to-navy-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all border border-navy-700">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <MdGroups className="text-terracotta-400" size={20} />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-white">Find your tribe</h3>
                    </div>
                    <p className="text-navy-200 text-sm mb-4 font-sans leading-relaxed">
                      Join 12,000+ others in the community. Share tips, events, and connect with like-minded people.
                    </p>
                    <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-3 rounded-xl text-sm font-heading font-bold transition-all text-white border border-white/10 flex items-center justify-center gap-2 group-hover:gap-3">
                      <MdChat size={18} />
                      Join Community
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                </div>

                {/* Quick Tips */}
                <div className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm">
                  <h4 className="font-heading font-bold text-navy-950 mb-3 text-sm">💡 Quick Tips</h4>
                  <ul className="space-y-3 text-sm text-navy-600 font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta-500 text-lg leading-none">•</span>
                      Complete your profile to get 3x more responses
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta-500 text-lg leading-none">•</span>
                      Save properties to compare them later
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta-500 text-lg leading-none">•</span>
                      Join a Buddy Group to find flatmates
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}