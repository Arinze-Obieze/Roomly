"use client";

import { useState, createContext } from "react";

export const DEFAULT_FILTERS = {
  // Existing
  minPrice: null,
  maxPrice: null,
  priceRange: 'all',
  bedrooms: [],
  minBedrooms: 0,
  minBathrooms: 0,
  propertyType: 'any',
  propertyTypes: [],
  amenities: [],
  sortBy: 'recommended',
  searchQuery: '',
  location: '',
  // New advanced filters
  moveInDate: 'any',       // 'any' | 'immediately' | 'this_month' | 'next_month' | 'flexible'
  roomType: 'any',         // 'any' | 'single' | 'double' | 'ensuite'
  houseRules: [],          // ['no_smoking', 'pets_allowed', 'couples_welcome', 'students_welcome']
  billsIncluded: false,
  minCompatibility: 60,    // 60–100, applied client-side only in V1
};

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState([
    { id: 1, name: "City Center Studios", filters: { propertyType: 'studio', propertyTypes: ['studio'] } },
    { id: 2, name: "1 Bedroom Apartments", filters: { bedrooms: [1] } }
  ]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const saveCurrentSearch = (name) => {
    const newSearch = {
      id: savedSearches.length + 1,
      name,
      filters: { ...filters }
    };
    setSavedSearches(prev => [newSearch, ...prev]);
  };

  const applySavedSearch = (savedFilters) => {
    setFilters(savedFilters);
  };

  return (
    <FilterContext.Provider value={{
      filters,
      savedSearches,
      updateFilters,
      resetFilters,
      saveCurrentSearch,
      applySavedSearch
    }}>
      {children}
    </FilterContext.Provider>
  );
};
