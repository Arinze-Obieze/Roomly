import { useEffect, useCallback, useRef } from "react";
import { useProperties } from "@/core/contexts/PropertiesContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";

// Debounce utility — defined outside component so it's stable
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Combines PropertiesContext + FilterContext.
 * Automatically re-fetches when filters change (debounced).
 */
export const usePropertiesWithFilters = (options = {}) => {
  const { autoFetch = true, debounceMs = 300 } = options;

  const { filters, updateFilters } = useFilters();
  const {
    properties,
    loading,
    isAppending,
    error,
    pagination,
    fetchProperties,
    loadMore,
    refresh,
  } = useProperties();

  // Keep a stable ref to fetchProperties so the debounced function
  // doesn't capture a stale copy.
  const fetchRef = useRef(fetchProperties);
  useEffect(() => { fetchRef.current = fetchProperties; }, [fetchProperties]);

  const debouncedFetch = useCallback(
    debounce((currentFilters) => {
      fetchRef.current(currentFilters, { page: 1 });
    }, debounceMs),
    [debounceMs]
  );

  // Auto-fetch whenever filters change
  useEffect(() => {
    if (autoFetch) debouncedFetch(filters);
  }, [filters, autoFetch, debouncedFetch]);

  // Load next page — passes current filters to context
  const loadNextPage = useCallback(() => {
    return loadMore(filters);
  }, [loadMore, filters]);

  // Refresh — clears both client cache and skips Redis cache
  const refreshProperties = useCallback(() => {
    return refresh(filters);
  }, [refresh, filters]);

  return {
    properties,
    loading,
    isAppending,
    error,
    pagination,
    hasMore: pagination.hasMore,
    loadNextPage,
    refresh: refreshProperties,
    filters,
    updateFilters,
  };
};