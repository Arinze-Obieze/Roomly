import { useEffect, useCallback, useRef } from "react";
import { useProperties } from "@/contexts/PropertiesContext";
import { useFilters } from "@/components/dashboard/filters/useFilters";

// Simple debounce function outside component to avoid recreation issues
// although useCallback below handles it, having a stable utility is fine.
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

/**
 * Custom hook that combines properties and filters
 * Automatically fetches properties when filters change
 */
export const usePropertiesWithFilters = (options = {}) => {
  const { 
    autoFetch = true,
    debounceMs = 300 
  } = options;

  const { filters, updateFilters } = useFilters();
  const { 
    properties, 
    loading, 
    error, 
    pagination,
    fetchProperties, 
    loadMore, 
    refresh 
  } = useProperties();

  // Create a stable debounced search function
  // We use a ref to keep the latest fetchProperties without re-creating the debounced function
  const fetchRef = useRef(fetchProperties);
  useEffect(() => {
      fetchRef.current = fetchProperties;
  }, [fetchProperties]);

  const debouncedFetch = useCallback(
    debounce((currentFilters) => {
      fetchRef.current(currentFilters, { page: 1 });
    }, debounceMs),
    [debounceMs] // Only recreate if debounceMs changes
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
    // If we manually search, we might want to update the context too?
    // Or just fetch? Usually 'search' implies updating the view.
    // Let's update the context if they are different, which triggers the effect.
    // BUT if we want immediate fetch bypassing debounce:
    updateFilters(customFilters); // This will trigger the effect
    // If we want to force fetch immediately without waiting for effect debounce:
    // fetchProperties(mergedFilters, { page: 1 });
    // But then the effect might fire again. 
    // Best practice with this pattern is just update filters and let the effect handle it.
  }, [filters, updateFilters]);

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
    hasMore: pagination.hasMore,
    filters,       // Export filters
    updateFilters  // Export update capability
  };
};