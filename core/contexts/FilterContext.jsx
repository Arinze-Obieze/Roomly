"use client";

import { useState, createContext } from "react";

export const DEFAULT_FILTERS = {
  minPrice: null,
  maxPrice: null,
  priceRange: 'all',
  bedrooms: [],
  minBedrooms: 0,
  minBathrooms: 0,
  propertyType: 'any',
  propertyTypes: [],
  amenities: [],
  moveInDate: 'any',
  sortBy: 'recommended',
  searchQuery: '',
  location: '',
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
