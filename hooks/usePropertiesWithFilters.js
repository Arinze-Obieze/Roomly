import { useEffect, useCallback } from "react";
import { useProperties } from "@/contexts/PropertiesContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";

/**
 * Custom hook that combines properties and filters
 * Automatically fetches properties when filters change
 */
export const usePropertiesWithFilters = (options = {}) => {
  const { 
    autoFetch = true,
    debounceMs = 300 
  } = options;

  const { filters } = useFilters();
  const { 
    properties, 
    loading, 
    error, 
    pagination,
    fetchProperties, 
    loadMore, 
    refresh 
  } = useProperties();

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce((filters) => {
      fetchProperties(filters, { page: 1 });
    }, debounceMs),
    [fetchProperties, debounceMs]
  );

  // Auto-fetch when filters change
  useEffect(() => {
    if (autoFetch) {
      debouncedFetch(filters);
    }
  }, [filters, autoFetch, debouncedFetch]);

  // Manual search with specific filters
  const search = useCallback((customFilters = {}) => {
    const mergedFilters = { ...filters, ...customFilters };
    return fetchProperties(mergedFilters, { page: 1, useCache: false });
  }, [filters, fetchProperties]);

  // Load next page
  const loadNextPage = useCallback(() => {
    return loadMore(filters);
  }, [loadMore, filters]);

  // Refresh current view
  const refreshProperties = useCallback(() => {
    return refresh(filters);
  }, [refresh, filters]);

  return {
    properties,
    loading,
    error,
    pagination,
    search,
    loadNextPage,
    refresh: refreshProperties,
    hasMore: pagination.hasMore
  };
};

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}