'use client';

import { 
  FilterModal, 
  WelcomeHeader, 
  DashboardFilters, 
  PropertyGrid, 
  EmptyState, 
  ErrorState 
} from "@/components/dashboard";
import { usePropertiesWithFilters } from "@/hooks/usePropertiesWithFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function HomeDashboard() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
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
      <FilterModal
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)}
      />

      <div className="flex-1 min-w-0">
        <WelcomeHeader 
          firstName={firstName}
          loading={loading}
          count={properties.length}
          onRefresh={refresh}
        />

        <main className="p-4 lg:p-8">
          <DashboardFilters setShowFilters={setShowFilters} />

          {error && <ErrorState error={error} onRetry={refresh} />}

          {!loading && properties.length === 0 && !error && (
            <EmptyState onReset={() => setShowFilters(true)} />
          )}

          <PropertyGrid 
            properties={properties} 
            loading={loading} 
            onSelect={(id) => router.push(`/listings/${id}`)}
          />

          {hasMore && (
             <div ref={loadMoreRef} className="h-20" />
          )}
        </main>
      </div>
    </div>
  );
}