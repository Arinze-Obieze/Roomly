'use client';

import { 
  DashboardFilters, 
  PropertyGrid, 
  EmptyState, 
  ErrorState,
  FilterPills,
  FilterModal,
} from "@/components/dashboard";
import BuddyWidget from "@/components/buddy/BuddyWidget";
import ProfileStrengthWidget from "@/components/dashboard/widgets/ProfileStrengthWidget";
import SupportWidget from "@/components/dashboard/widgets/SupportWidget";
import GlobalSpinner from "@/components/ui/GlobalSpinner";
import { useInfinitePropertiesWithFilters } from "@/core/hooks/useInfinitePropertiesWithFilters";
import useDelayedBoolean from "@/core/hooks/useDelayedBoolean";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { MdGroups, MdChat, MdSearch } from "react-icons/md";

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { resetFilters } = useFilters();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(true);
  const lastScrollY = useRef(0);
  const sentinelRef = useRef(null);

  const handleSelectProperty = useCallback((id) => {
    router.push(`/listings/${id}`);
  }, [router]);

  const {
    properties,
    loading,
    isRefreshing,
    isAppending,
    error,
    hasMore,
    dataUpdatedAt,
    loadNextPage,
    refresh,
    filters,
    updateFilters,
  } = useInfinitePropertiesWithFilters({ autoFetch: true, debounceMs: 300 });
  const showAppendingStatus = useDelayedBoolean(isAppending, 180);

  // Stable refs so the observer callback never goes stale
  const hasMoreRef       = useRef(hasMore);
  const isAppendingRef   = useRef(isAppending);
  const loadingRef       = useRef(loading);
  const refreshingRef    = useRef(isRefreshing);
  const loadNextPageRef  = useRef(loadNextPage);

  useEffect(() => { hasMoreRef.current      = hasMore;      }, [hasMore]);
  useEffect(() => { isAppendingRef.current  = isAppending;  }, [isAppending]);
  useEffect(() => { loadingRef.current      = loading;      }, [loading]);
  useEffect(() => { refreshingRef.current   = isRefreshing; }, [isRefreshing]);
  useEffect(() => { loadNextPageRef.current = loadNextPage; }, [loadNextPage]);

  // ── IntersectionObserver — rebuilt after every page load ─────────────────
  // Re-creating the observer when fresh data lands resets its intersection state,
  // so if the sentinel is already in view (short pages), the callback fires
  // immediately — no "stuck" observer problem.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        hasMoreRef.current &&
        !loadingRef.current &&
        !refreshingRef.current &&
        !isAppendingRef.current
      ) {
        loadNextPageRef.current();
      }
    }, { rootMargin: '300px', threshold: 0 });

    obs.observe(sentinel);
    return () => obs.disconnect();
  // Intentionally depend on data freshness so the observer rebuilds
  // (and re-fires if in view) after each successful page load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt]);

  // ── Scroll direction — auto-hide mobile filter bar ────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 120) {
        setShowMobileFilters(true);
      } else if (y > lastScrollY.current + 10) {
        setShowMobileFilters(false);
      } else if (y < lastScrollY.current - 10) {
        setShowMobileFilters(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Match-score bootstrap ─────────────────────────────────────────────────
  // When a freshly logged-in user has no cached scores yet, trigger a
  // background recompute so match % badges appear on subsequent loads.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function bootstrapScores() {
      try {
        const statusRes = await fetch('/api/matching/status');
        const { hasScores, missingProfile } = await statusRes.json();
        if (hasScores || missingProfile || cancelled) return;

        await fetch('/api/matching/recompute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'seeker' }),
        });

        if (!cancelled) refresh();
      } catch {
        // Scores are a nice-to-have; never block the UI
      }
    }

    bootstrapScores();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="flex min-h-screen bg-navy-50">
      <div className="flex-1 min-w-0">
        <main className="px-4 lg:px-8 py-4 lg:py-6 w-full max-w-[1800px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <section className="flex-1 min-w-0 pb-20">

              {/* Hero & Search — desktop only */}
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

              {/* Sticky filter bar */}
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

              {/* Properties area */}
              <div className="mt-0">
                <FilterModal
                  isOpen={isFilterModalOpen}
                  onClose={() => setIsFilterModalOpen(false)}
                  resultsCount={properties.length}
                  isLoading={loading}
                />

                {error && <ErrorState error={error} onRetry={refresh} />}

                {!loading && !isAppending && !isRefreshing && properties.length === 0 && !error && (
                  <EmptyState
                    onReset={resetFilters}
                    location={filters.location}
                  />
                )}

                {/* Card grid — never disappears during load-more */}
                <PropertyGrid
                  properties={properties}
                  loading={loading}
                  onSelect={handleSelectProperty}
                />

                {/* ── Infinite-scroll sentinel ──────────────────────────── */}
                <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
                <div className="mt-6 flex min-h-20 items-center justify-center">
                  {isRefreshing ? (
                    <div className="inline-flex items-center gap-3 rounded-full border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-600 shadow-sm">
                      <GlobalSpinner size="sm" color="primary" />
                      Updating results…
                    </div>
                  ) : isAppending ? (
                    showAppendingStatus ? (
                      <div className="inline-flex items-center gap-3 rounded-full border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-600 shadow-sm">
                        <GlobalSpinner size="sm" color="primary" />
                        Loading more listings…
                      </div>
                    ) : null
                  ) : hasMore && !loading && !isRefreshing ? (
                    <button
                      type="button"
                      onClick={() => loadNextPage()}
                      className="px-5 py-2.5 rounded-xl bg-white border border-navy-200 text-navy-700 font-semibold shadow-sm hover:shadow-md hover:border-navy-300 transition-all"
                    >
                      Load more
                    </button>
                  ) : !hasMore && properties.length > 0 && !loading && !isRefreshing ? (
                    <p className="text-sm text-navy-400 font-sans">
                      You&rsquo;ve seen all available listings
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* ── Right Sidebar ─────────────────────────────────────────── */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="sticky top-[100px] h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide pb-8 space-y-6">
                <ProfileStrengthWidget />
                <BuddyWidget />
                {/* <SupportWidget /> */}

                <div className="bg-white rounded-3xl border border-navy-100 p-6 shadow-sm">
                  <h4 className="font-heading font-bold text-navy-950 mb-3 text-sm">💡 Quick Tips</h4>
                  <ul className="space-y-3 text-sm text-navy-600 font-sans">
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta-500 text-lg leading-none">•</span>
                      Complete your profile to get 3× more responses
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
