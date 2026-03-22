import { useCallback, useEffect, useMemo } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import useDebouncedValue from "@/core/hooks/useDebouncedValue";

function buildPropertySearchParams(filters, pageSize, pageParam = null) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: String(pageSize),
  });

  if (pageParam?.cursor) {
    params.set("cursor", pageParam.cursor);
  }

  if (filters.priceRange && filters.priceRange !== "all") {
    params.set("priceRange", filters.priceRange);
  }
  if (typeof filters.minPrice === "number" && filters.minPrice >= 0) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (typeof filters.maxPrice === "number" && filters.maxPrice > 0) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.bedrooms?.length > 0) {
    params.set("bedrooms", filters.bedrooms.join(","));
  }
  if (filters.propertyType && filters.propertyType !== "any") {
    params.set("propertyType", filters.propertyType);
  }
  if (filters.propertyTypes?.length > 0) {
    params.set("propertyTypes", filters.propertyTypes.join(","));
  }
  if (filters.amenities?.length > 0) {
    params.set("amenities", filters.amenities.join(","));
  }
  if (filters.location) {
    params.set("location", filters.location);
  }
  if (filters.minBedrooms) {
    params.set("minBedrooms", String(filters.minBedrooms));
  }
  if (filters.minBathrooms) {
    params.set("minBathrooms", String(filters.minBathrooms));
  }
  if (filters.searchQuery) {
    params.set("search", filters.searchQuery);
  }
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.moveInDate && filters.moveInDate !== "any") {
    params.set("moveInDate", filters.moveInDate);
  }
  if (filters.roomType && filters.roomType !== "any") {
    params.set("roomType", filters.roomType);
  }
  if (filters.houseRules?.length > 0) {
    params.set("houseRules", filters.houseRules.join(","));
  }
  if (filters.billsIncluded === true) {
    params.set("billsIncluded", "true");
  }

  return params;
}

function dedupeById(items) {
  const seen = new Map();
  for (const item of items) {
    seen.set(item.id, item);
  }
  return Array.from(seen.values());
}

export function useInfinitePropertiesWithFilters(options = {}) {
  const { autoFetch = true, debounceMs = 300, initialFilters = {} } = options;

  const { user } = useAuthContext();
  const { filters, updateFilters } = useFilters();
  const initialFiltersKey = JSON.stringify(initialFilters || {});
  const mergedFilters = useMemo(() => {
    const { pageSize, ...rest } = initialFilters || {};
    return { ...filters, ...rest };
  }, [filters, initialFiltersKey]);

  const pageSize = typeof initialFilters?.pageSize === "number" && initialFilters.pageSize > 0
    ? initialFilters.pageSize
    : 12;

  const debouncedFilters = useDebouncedValue(mergedFilters, debounceMs);
  const stableUserKey = user?.id || "anon";
  const queryKey = useMemo(() => ([
    "properties",
    stableUserKey,
    pageSize,
    debouncedFilters,
  ]), [stableUserKey, pageSize, debouncedFilters]);

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null,
    enabled: autoFetch,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    queryFn: async ({ pageParam, signal }) => {
      const params = buildPropertySearchParams(debouncedFilters, pageSize, pageParam);
      const response = await fetch(`/api/properties?${params.toString()}`, {
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch properties");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination?.hasMore || !lastPage?.pagination?.nextCursor) {
        return undefined;
      }
      return { cursor: lastPage.pagination.nextCursor };
    },
  });

  const properties = useMemo(() => {
    const pages = query.data?.pages || [];
    return dedupeById(pages.flatMap((page) => page?.data || []));
  }, [query.data]);

  const pagination = useMemo(() => {
    const lastPage = query.data?.pages?.[query.data.pages.length - 1];
    return lastPage?.pagination || {
      page: 1,
      pageSize,
      total: null,
      hasMore: false,
      nextCursor: null,
    };
  }, [query.data, pageSize]);

  const loading = query.isPending && properties.length === 0;
  const isRefreshing = query.isFetching && !query.isFetchingNextPage && properties.length > 0;
  const isAppending = query.isFetchingNextPage;
  const error = query.error?.message || null;
  const hasMore = !!query.hasNextPage;
  const dataUpdatedAt = query.dataUpdatedAt;
  const fetchNextPage = query.fetchNextPage;
  const refetch = query.refetch;

  const loadNextPage = useCallback(() => {
    if (!hasMore || isAppending || loading || isRefreshing) return Promise.resolve();
    return fetchNextPage();
  }, [hasMore, isAppending, loading, isRefreshing, fetchNextPage]);

  const refresh = useCallback(() => {
    return refetch();
  }, [refetch]);

  return {
    properties,
    loading,
    isRefreshing,
    isAppending,
    error,
    hasMore,
    pagination,
    dataUpdatedAt,
    loadNextPage,
    refresh,
    filters,
    updateFilters,
  };
}
