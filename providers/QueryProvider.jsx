'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Caching strategy by data type
const CACHE_CONFIG = {
  // Real-time data (chat, notifications) - very short TTL
  realtime: { staleTime: 0, gcTime: 5 * 60 * 1000 }, // 5 min garbage collection
  
  // User-specific data (profile, preferences) - moderate TTL
  user: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 }, // 10 min fresh, 30 min garbage
  
  // Listings & search results - longer TTL, user can refresh manually
  listings: { staleTime: 5 * 60 * 1000, gcTime: 60 * 60 * 1000 }, // 5 min fresh, 1 hour garbage
  
  // Static content (amenities, locations, interests) - very long TTL
  static: { staleTime: 24 * 60 * 60 * 1000, gcTime: 7 * 24 * 60 * 60 * 1000 }, // 24h fresh, 7d garbage
  
  // Community data (posts, comments) - moderate with invalidation
  community: { staleTime: 2 * 60 * 1000, gcTime: 30 * 60 * 1000 }, // 2 min fresh, 30 min garbage
};

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000, // garbage collection time (was cacheTime in older versions)
        retry: (failureCount, error) => {
          // Don't retry 401/403/404
          if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false, // prevent aggressive refetching
        refetchOnReconnect: true, // refetch when reconnect from offline
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  // Expose cache config for use in hooks
  queryClient.cacheConfig = CACHE_CONFIG;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
