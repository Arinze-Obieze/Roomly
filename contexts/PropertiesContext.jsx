"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AMENITIES } from "@/data/amenities";
import { useAuthContext } from "@/contexts/AuthContext";

const PropertiesContext = createContext();

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error("useProperties must be used within PropertiesProvider");
  }
  return context;
};

export const PropertiesProvider = ({ children }) => {
  const { user } = useAuthContext();
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
    const cacheKey = JSON.stringify({ filters, page, pageSize, userId: user?.id });
    
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

      const supabase = createClient();
      
      // Fetch Match Scores if User is Logged In
      let scoresMap = new Map();
      if (user) {
        const { data: scores } = await supabase.rpc('get_property_matches', { seeker_id: user.id });
        if (scores) {
          scores.forEach(s => scoresMap.set(s.property_id, s.match_score));
        }
      }

      // Build query
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_media (
            id,
            url,
            media_type,
            display_order
          ),
          users (
            id,
            full_name,
            profile_picture,
            is_verified
          )
        `, { count: 'exact' })
        .eq('is_active', true);

      // Sorting
      const sortBy = filters.sortBy || 'recommended';
      if (sortBy === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc') {
         query = query.order('price_per_month', { ascending: true });
      } else if (sortBy === 'price_desc') {
         query = query.order('price_per_month', { ascending: false });
      } else {
         // Default / Recommended: fetch more recent first, but we will custom sort
         query = query.order('created_at', { ascending: false });
      }

      // Apply filters
      if (filters.priceRange && filters.priceRange !== 'all') {
        const priceRanges = {
          budget: { min: 0, max: 800 },
          mid: { min: 800, max: 1500 },
          premium: { min: 1500, max: 999999 }
        };
        const range = priceRanges[filters.priceRange];
        if (range) {
          query = query.gte('price_per_month', range.min).lte('price_per_month', range.max);
        }
      }

      if (filters.bedrooms && filters.bedrooms.length > 0) {
        query = query.in('bedrooms', filters.bedrooms);
      }

      if (filters.propertyType && filters.propertyType !== 'any') {
        query = query.eq('property_type', filters.propertyType);
      }

      if (filters.verifiedOnly) {
        // Only show properties from verified users
        query = query.eq('users.is_verified', true);
      }

      if (filters.amenities && filters.amenities.length > 0) {
        // Assuming amenities is a JSONB array column
        query = query.contains('amenities', filters.amenities);
      }

      // Updated Filter Logic for Ireland
      if (filters.location && filters.location !== 'All Ireland') {
        const locationQuery = filters.location.trim();
        // Check if it matches a known county
        query = query.or(`state.ilike.%${locationQuery}%,city.ilike.%${locationQuery}%`);
      }

      if (filters.area) {
         query = query.or(`city.ilike.%${filters.area}%`);
      }

      // Pagination Strategy
      // If 'new' or basic sort, use DB pagination.
      // If 'recommended', we need to fetch more to sort by match score effectively.
      // For now, sticking to standard pagination for 'new'.
      // For 'recommended', we'll fetch a larger set first page (e.g. 50) and sort client side.
      
      let from, to;
      if (sortBy === 'recommended' && page === 1) {
         // Fetch top 50 candidates to sort by relevance
         from = 0;
         to = 49;
      } else {
         from = (page - 1) * pageSize;
         to = from + pageSize - 1;
      }
      
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match your listing format
      let transformedData = data.map(property => {
        const userData = property.users;

        const getImageUrl = (url) => {
          if (!url) return '/placeholder-property.jpg';
          if (url.startsWith('http')) return url;
          return supabase.storage.from('property-media').getPublicUrl(url).data.publicUrl;
        };

        return {
          id: property.id,
          title: property.title,
          location: `${property.city}, ${property.state}`,
          price: `€${property.price_per_month}`,
          period: 'month',
          image: getImageUrl(property.property_media?.[0]?.url),
          images: property.property_media?.map(m => getImageUrl(m.url)) || [],
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          propertyType: property.property_type,
          amenities: transformAmenities(property.amenities || []),
          verified: userData?.is_verified || false,
          host: {
            name: userData?.full_name || 'Unknown',
            avatar: userData?.profile_picture || null,
            id: property.listed_by_user_id
          },
          matchScore: scoresMap.size > 0 ? Math.round(scoresMap.get(property.id) || 0) : null,
          description: property.description,
          availableFrom: property.available_from,
          createdAt: property.created_at
        };
      });

      // Client-side Sort for Recommended
      if (sortBy === 'recommended') {
        transformedData.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        // Recalculate pagination slice if we fetched extra
        if (page === 1) {
           transformedData = transformedData.slice(0, pageSize);
        }
      } 
      
      // If Pass tab (assuming it was 'pets' or something else, but user said 'pass')
      // For now, 'Pass' will just be treated as 'New' or no special sort unless we define it.
      // If 'pass' meant 'past', we don't have that.
      
      const newPagination = {
        page,
        pageSize,
        total: count || 0,
        hasMore: (page * pageSize) < (count || 0)
      };

      // Update cache
      cacheRef.current.set(cacheKey, {
        data: transformedData,
        pagination: newPagination,
        timestamp: Date.now()
      });

      // Clean old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setProperties(append ? prev => [...prev, ...transformedData] : transformedData);
      setPagination(newPagination);

      return { data: transformedData, pagination: newPagination };

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching properties:', err);
      setError(err.message);
      return { data: [], pagination: { page: 1, pageSize, total: 0, hasMore: false } };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
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
  }, [pagination, loading, fetchProperties, user]);

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
 * Helper function to transform amenities from database format
 */
function transformAmenities(amenities) {
  return amenities.map(amenityStr => {
    // Find the amenity object in our constant
    // Match by value (preferred) or label if needed, or fallback
    const key = amenityStr.toLowerCase();
    const found = AMENITIES.find(a => a.value === key || a.label.toLowerCase() === key);
    
    if (found) {
      return found; // Returns { value, label, icon: Component }
    }
    
    // Fallback if not found in our list
    return { 
      value: key, 
      label: amenityStr, 
      icon: AMENITIES[0].icon // Fallback to first icon (WiFi) or a specific unknown icon
    };
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