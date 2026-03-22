"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { FaWifi, FaPaw, FaCar, FaShower, FaTree } from 'react-icons/fa';

const PropertiesContext = createContext();

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error("useProperties must be used within PropertiesProvider");
  }
  return context;
};

// Client-side cache entry TTL: 2 minutes (keeps hot-path fast, avoids serving stale data)
const CLIENT_CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 20;

export const PropertiesProvider = ({ children }) => {
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isAppending, setIsAppending] = useState(false); // separate from full-page loading
  const [error, setError]             = useState(null);
  const [pagination, setPagination]   = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: true,
    nextCursor: null,
  });

  // ── Internal refs ─────────────────────────────────────────────────────────
  const cacheRef             = useRef(new Map()); // { cacheKey → { data, pagination, ts } }
  const abortControllerRef   = useRef(null);
  const requestIdRef         = useRef(0);

  // Refs that allow loadMore / observer callbacks to read the latest state
  // without being stale-closure victims.
  const loadingRef           = useRef(loading);
  const isAppendingRef       = useRef(false);
  const paginationRef        = useRef(pagination);

  useEffect(() => { loadingRef.current     = loading;    }, [loading]);
  useEffect(() => { isAppendingRef.current = isAppending;}, [isAppending]);
  useEffect(() => { paginationRef.current  = pagination; }, [pagination]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isCacheValid = (entry) =>
    entry && (Date.now() - entry.ts) < CLIENT_CACHE_TTL_MS;

  const pruneCache = (map) => {
    if (map.size <= MAX_CACHE_ENTRIES) return;
    // Delete oldest entries by insertion order
    const toDelete = map.size - MAX_CACHE_ENTRIES;
    let deleted = 0;
    for (const key of map.keys()) {
      map.delete(key);
      if (++deleted >= toDelete) break;
    }
  };

  // ── Core fetch ────────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async (filters = {}, options = {}) => {
    const {
      page      = 1,
      pageSize  = 12,
      append    = false,
      useCache  = true,
      noStore   = false, // forces cache-busting at HTTP level (for refresh)
    } = options;

    const requestId = ++requestIdRef.current;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Client cache check (only for non-append, non-noStore requests)
    const cacheKey = JSON.stringify({ filters, page, pageSize });
    if (!append && useCache && !noStore) {
      const entry = cacheRef.current.get(cacheKey);
      if (isCacheValid(entry)) {
        setProperties(entry.data);
        setPagination(entry.pagination);
        setLoading(false);
        return entry;
      }
    }

    try {
      if (append) {
        setIsAppending(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Build query params
      const params = new URLSearchParams({
        page:     page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filters.priceRange && filters.priceRange !== 'all')
        params.append('priceRange', filters.priceRange);
      if (typeof filters.minPrice === 'number' && filters.minPrice >= 0)
        params.append('minPrice', filters.minPrice.toString());
      if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0)
        params.append('maxPrice', filters.maxPrice.toString());
      if (filters.bedrooms?.length > 0)
        params.append('bedrooms', filters.bedrooms.join(','));
      if (filters.propertyType && filters.propertyType !== 'any')
        params.append('propertyType', filters.propertyType);
      if (filters.propertyTypes?.length > 0)
        params.append('propertyTypes', filters.propertyTypes.join(','));
      if (filters.amenities?.length > 0)
        params.append('amenities', filters.amenities.join(','));
      if (filters.location)
        params.append('location', filters.location);
      if (filters.minBedrooms)
        params.append('minBedrooms', filters.minBedrooms.toString());
      if (filters.minBathrooms)
        params.append('minBathrooms', filters.minBathrooms.toString());
      if (filters.searchQuery)
        params.append('search', filters.searchQuery);
      if (filters.sortBy)
        params.append('sortBy', filters.sortBy);
      if (filters.moveInDate && filters.moveInDate !== 'any')
        params.append('moveInDate', filters.moveInDate);
      if (filters.roomType && filters.roomType !== 'any')
        params.append('roomType', filters.roomType);
      if (filters.houseRules?.length > 0)
        params.append('houseRules', filters.houseRules.join(','));
      if (filters.billsIncluded === true)
        params.append('billsIncluded', 'true');
      if (noStore)
        params.append('noStore', '1');
      // Cursor-based keyset pagination for standard sorts
      if (options.cursor)
        params.append('cursor', options.cursor);

      const fetchOptions = {
        signal: abortControllerRef.current.signal,
        ...(noStore ? { cache: 'no-store' } : {}),
      };

      const response = await fetch(`/api/properties?${params.toString()}`, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch properties');
      }

      const { data: raw, pagination: newPagination } = await response.json();

      const enriched = raw.map(p => ({
        ...p,
        amenities: transformAmenities(p.amenities || []),
        matchScore: p.matchScore ?? null,
      }));

      // Write to client cache (for non-append, non-noStore)
      if (!append && !noStore) {
        cacheRef.current.set(cacheKey, {
          data: enriched,
          pagination: newPagination,
          ts: Date.now(),
        });
        pruneCache(cacheRef.current);
      }

      if (requestId !== requestIdRef.current) return; // superseded

      setProperties(append
        ? prev => {
            // Deduplicate by id
            const map = new Map(prev.map(p => [p.id, p]));
            enriched.forEach(p => map.set(p.id, p));
            return Array.from(map.values());
          }
        : enriched
      );
      setPagination(newPagination);

      return { data: enriched, pagination: newPagination };

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[PropertiesContext] fetch error:', err);
      if (requestId === requestIdRef.current) {
        setError(err.message);
      }
      return { data: [], pagination: { page: 1, pageSize, total: 0, hasMore: false } };
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setIsAppending(false);
        abortControllerRef.current = null;
      }
    }
  }, []); // stable — never recreated

  // ── Load more (infinite scroll) ───────────────────────────────────────────
  // Uses refs for the guards so it's never stale, regardless of when it's called.
  const loadMore = useCallback(async (filters = {}) => {
    // Guard via refs — immune to stale closures
    if (!paginationRef.current.hasMore) return;
    if (loadingRef.current || isAppendingRef.current) return;

    const { nextCursor, page, pageSize } = paginationRef.current;

    await fetchProperties(filters, {
      // Prefer cursor-based pagination; fall back to page+1 if no cursor
      ...(nextCursor
        ? { cursor: nextCursor, pageSize, append: true }
        : { page: page + 1, pageSize, append: true }
      ),
    });
  }, [fetchProperties]); // only depends on the stable fetchProperties

  // ── Refresh (bust both client and server cache) ───────────────────────────
  const refresh = useCallback(async (filters = {}) => {
    cacheRef.current.clear();
    await fetchProperties(filters, { page: 1, useCache: false, noStore: true });
  }, [fetchProperties]);

  // ── Clear client cache only ───────────────────────────────────────────────
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Abort on unmount
  useEffect(() => () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const value = {
    properties,
    loading,
    isAppending,
    error,
    pagination,
    fetchProperties,
    loadMore,
    refresh,
    clearCache,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
};

// ── Amenity icon hydration ─────────────────────────────────────────────────
function transformAmenities(amenities) {
  const iconMap = {
    wifi:    { icon: FaWifi,   label: 'WiFi' },
    pets:    { icon: FaPaw,    label: 'Pets Allowed' },
    parking: { icon: FaCar,    label: 'Parking' },
    ensuite: { icon: FaShower, label: 'Ensuite' },
    garden:  { icon: FaTree,   label: 'Garden' },
  };

  return amenities.map(amenity => {
    const label = typeof amenity === 'string' ? amenity : amenity.label;
    const key   = label?.toLowerCase() ?? '';
    return iconMap[key] || { icon: FaWifi, label: label || 'Amenity' };
  });
}
