"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { FaWifi, FaPaw, FaCar, FaShower, FaTree } from 'react-icons/fa';

const PropertiesContext = createContext();

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error("useProperties must be used within PropertiesProvider");
  }
  return context;
};

export const PropertiesProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: true
  });

  // Cache to avoid unnecessary refetches
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Fetch properties with filters and pagination
   */
  const fetchProperties = useCallback(async (filters = {}, options = {}) => {
    const { 
      page = 1, 
      pageSize = 12, 
      append = false,
      useCache = true 
    } = options;

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Generate cache key
    const cacheKey = JSON.stringify({ filters, page, pageSize });
    
    // Check cache
    if (useCache && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setProperties(append ? prev => [...prev, ...cached.data] : cached.data);
      setPagination(cached.pagination);
      setLoading(false);
      return cached;
    }

    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (filters.priceRange && filters.priceRange !== 'all') {
        params.append('priceRange', filters.priceRange);
      }
      if (filters.bedrooms?.length > 0) {
        params.append('bedrooms', filters.bedrooms.join(','));
      }
      if (filters.propertyType && filters.propertyType !== 'any') {
        params.append('propertyType', filters.propertyType);
      }
      if (filters.verifiedOnly) {
        params.append('verifiedOnly', 'true');
      }
      if (filters.amenities?.length > 0) {
        params.append('amenities', filters.amenities.join(','));
      }
      if (filters.location) {
        params.append('location', filters.location);
      }
      if (filters.minBedrooms) {
        params.append('minBedrooms', filters.minBedrooms.toString());
      }
      if (filters.minBathrooms) {
        params.append('minBathrooms', filters.minBathrooms.toString());
      }
      if (filters.searchQuery) {
        params.append('search', filters.searchQuery);
      }

      const response = await fetch(`/api/properties?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch properties');
      }

      const { data: transformedData, pagination: newPagination } = await response.json();

      const dataWithHydratedIcons = transformedData.map(p => ({
         ...p,
         amenities: transformAmenities(p.amenities || []),
         matchScore: calculateMatchScore(p, filters)
      }));

      // Update cache
      cacheRef.current.set(cacheKey, {
        data: dataWithHydratedIcons,
        pagination: newPagination,
        timestamp: Date.now()
      });

      // Clean old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setProperties(append ? prev => [...prev, ...dataWithHydratedIcons] : dataWithHydratedIcons);
      setPagination(newPagination);

      return { data: dataWithHydratedIcons, pagination: newPagination };

    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching properties:', err);
      setError(err.message);
      return { data: [], pagination: { page: 1, pageSize, total: 0, hasMore: false } };
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
         setLoading(false);
         abortControllerRef.current = null;
      }
    }
  }, []);

  /**
   * Load more properties (infinite scroll)
   */
  const loadMore = useCallback(async (filters = {}) => {
    if (!pagination.hasMore || loading) return;
    
    await fetchProperties(filters, {
      page: pagination.page + 1,
      pageSize: pagination.pageSize,
      append: true
    });
  }, [pagination, loading, fetchProperties]);

  /**
   * Refresh properties (force refetch)
   */
  const refresh = useCallback(async (filters = {}) => {
    cacheRef.current.clear();
    await fetchProperties(filters, { page: 1, useCache: false });
  }, [fetchProperties]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const value = {
    properties,
    loading,
    error,
    pagination,
    fetchProperties,
    loadMore,
    refresh,
    clearCache
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
};

/**
 * Helper function to transform amenities from database format or API format
 */
function transformAmenities(amenities) {
  const iconMap = {
    wifi: { icon: FaWifi, label: 'WiFi' },
    pets: { icon: FaPaw, label: 'Pets Allowed' },
    parking: { icon: FaCar, label: 'Parking' },
    ensuite: { icon: FaShower, label: 'Ensuite' },
    garden: { icon: FaTree, label: 'Garden' }
  };

  return amenities.map(amenity => {
    // Handle both string (DB) and object (API) formats
    const label = typeof amenity === 'string' ? amenity : amenity.label;
    const key = label ? label.toLowerCase() : '';
    return iconMap[key] || { icon: FaWifi, label: label || 'Amenity' };
  });
}

/**
 * Calculate match score based on user preferences
 * This is a placeholder - implement your own algorithm
 */
function calculateMatchScore(property, filters) {
  let score = 70; // Base score

  // Price match
  if (filters.priceRange) {
    score += 10;
  }

  // Bedrooms match
  if (filters.bedrooms?.includes(property.bedrooms)) {
    score += 10;
  }

  // Amenities match
  if (filters.amenities?.length > 0) {
    const matchingAmenities = filters.amenities.filter(a => 
      property.amenities?.includes(a)
    );
    score += (matchingAmenities.length / filters.amenities.length) * 10;
  }

  return Math.min(Math.round(score), 99);
}