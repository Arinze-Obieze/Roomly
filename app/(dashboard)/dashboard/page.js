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
import GlobalSpinner from "@/components/ui/GlobalSpinner";
import { usePropertiesWithFilters } from "@/core/hooks/usePropertiesWithFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { MdGroups, MdChat, MdSearch } from "react-icons/md";

export default function HomeDashboard() {
  const router = useRouter();
  const loadMoreRef = useRef(null);
  const { user } = useAuthContext();
  const { resetFilters } = useFilters();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(true);
  const lastScrollY = useRef(0);
  
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

  // Scroll direction detection for auto-hiding mobile filters
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Don't auto-hide when near the very top of the page
      if (currentScrollY < 120) {
        setShowMobileFilters(true);
      } else if (currentScrollY > lastScrollY.current + 10) {
        // Scrolling down (hide)
        setShowMobileFilters(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        // Scrolling up (show)
        setShowMobileFilters(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen bg-navy-50">
      <div className="flex-1 min-w-0">
        <main className="px-4 lg:px-8 py-4 lg:py-6 w-full max-w-[1800px] mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            
            {/* Main Content - Properties & Filters */}
            <section className="flex-1 min-w-0 pb-20">
              
              {/* Hero & Search Section (Z-Pattern entry point) - Desktop Only */}
              <div className="mb-8 pt-4 hidden lg:block">
                <h1 className="text-3xl lg:text-4xl font-heading font-extrabold text-navy-950 mb-3 tracking-tight">
                  Find your perfect <span className="text-terracotta-500">space.</span>
                </h1>
                <p className="text-navy-600 text-lg mb-6 max-w-2xl font-sans">
                  Discover thousands of rooms, private rentals, and potential flatmates matching your exact needs.
                </p>
                <div className="relative max-w-3xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdSearch className="text-navy-400 text-2xl" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by city, neighborhood, or university..." 
                    value={filters.searchQuery || ''}
                    onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 lg:py-5 bg-white border-2 border-navy-100 focus:border-terracotta-400 rounded-2xl shadow-sm focus:shadow-md hover:border-navy-200 transition-all outline-none text-navy-950 text-base lg:text-lg font-medium placeholder:text-navy-400"
                  />
                  {filters.searchQuery && (
                    <button 
                      onClick={() => updateFilters({ searchQuery: '' })}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-navy-400 hover:text-navy-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sticky Filter Container - Auto-hides on mobile scroll down */}
              <div 
                className={`sticky lg:top-[73px] z-50 bg-navy-50/95 pt-3 pb-3 backdrop-blur-md flex flex-col xl:flex-row xl:items-start gap-4 xl:justify-between border-b border-navy-100 mb-6 transition-all duration-300 ease-in-out ${
                  showMobileFilters 
                    ? 'top-[126px] opacity-100 translate-y-0' 
                    : 'top-[126px] opacity-0 -translate-y-full pointer-events-none lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <FilterPills onOpenFilters={() => setIsFilterModalOpen(true)} />
                </div>
                <div className="hidden lg:block shrink-0 relative z-40 xl:mt-0">
                  <DashboardFilters onOpenFilters={() => setIsFilterModalOpen(true)} />
                </div>
              </div>

              {/* Properties Range */}
              <div className="mt-0">

              {/* Filter Modal for Mobile */}
              <FilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)}
                resultsCount={properties.length}
                isLoading={loading}
              />

              {/* Error State */}
              {error && <ErrorState error={error} onRetry={refresh} />}

              {/* Empty State */}
              {!loading && properties.length === 0 && !error && (
                <EmptyState 
                  onReset={resetFilters}
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
                    <GlobalSpinner size="md" color="primary" />
                  </div>
                )}
              </div>
            </section>

            {/* Right Sidebar - Widgets */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[100px] h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide pb-8 space-y-6">
                {/* Profile Strength - Most Important */}
                <ProfileStrengthWidget />
                
                {/* Buddy Group Widget */}
                <BuddyWidget />
                
                {/* Simplified Community CTA */}
                {/* <div className="bg-white rounded-3xl p-6 shadow-sm border border-navy-100 hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-navy-50 rounded-xl text-terracotta-500">
                      <MdGroups size={20} />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-navy-950">Find your tribe</h3>
                  </div>
                  <p className="text-navy-600 text-sm mb-5 font-sans leading-relaxed">
                    Join 12,000+ others sharing tips, events, and room hunting advice.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/community')}
                    className="w-full bg-navy-50 hover:bg-navy-100 text-navy-900 border border-navy-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MdChat size={18} className="text-terracotta-500" />
                    Join Community
                  </button>
                </div> */}

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
