"use client";

import { useState, createContext } from "react";

export const DEFAULT_FILTERS = {
  priceRange: 'all',
  bedrooms: [],
  propertyType: 'any',
  amenities: [],
  moveInDate: 'any',
  verifiedOnly: false,
  sortBy: 'recommended',
  searchQuery: '',
};

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState([
    { id: 1, name: "City Center Studios", filters: { propertyType: 'studio' } },
    { id: 2, name: "Verified Listings", filters: { verifiedOnly: true } },
    { id: 3, name: "1 Bedroom Apartments", filters: { bedrooms: [1] } }
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


