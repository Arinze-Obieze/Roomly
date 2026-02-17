'use client';

import { useState, useCallback } from 'react';
import { MdSearch } from 'react-icons/md';
import LocationFilter from './filters/LocationFilter';
import PriceFilter from './filters/PriceFilter';
import BedsBathsFilter from './filters/BedsBathsFilter';
import PropertyTypeFilter from './filters/PropertyTypeFilter';

export default function FilterBar({ filters = {}, onFilterChange, className = '', isSticky = true }) {
  
  const handleLocationChange = (val) => {
      onFilterChange('location', val);
  };

  const handlePriceChange = (min, max) => {
      onFilterChange('priceRange', { min, max });
  };
  
  const handleBedsBathsChange = (key, val) => {
      // key is 'bedrooms' or 'bathrooms'
      onFilterChange(key, val);
  };

  const handleTypeChange = (val) => {
      onFilterChange('propertyType', val);
  };

  return (
    <div className={`${isSticky ? 'sticky top-[72px] z-40 border-b border-slate-200' : ''} bg-white shadow-sm ${className}`}>
      <div className="container mx-auto px-4 md:px-6 py-4">
        
        {/* Unified Bar */}
        <div className="flex flex-col md:flex-row items-center bg-white border border-slate-200 rounded-3xl shadow-lg md:shadow-md md:divide-x divide-slate-200 p-2 md:p-0">
          
          {/* Location */}
          <div className="w-full md:flex-1">
             <LocationFilter 
               value={filters.location} 
               onChange={handleLocationChange} 
             />
          </div>

          {/* Property Type */}
          <div className="w-full md:w-auto md:border-l-0 border-t md:border-t-0 border-slate-100">
             <PropertyTypeFilter 
               value={filters.propertyType} 
               onChange={handleTypeChange} 
             />
          </div>

          {/* Beds & Baths */}
          <div className="w-full md:w-auto border-t md:border-t-0 border-slate-100">
             <BedsBathsFilter 
               beds={filters.minBedrooms} 
               baths={filters.minBathrooms} 
               onChange={handleBedsBathsChange} 
             />
          </div>

          {/* Price */}
          <div className="w-full md:w-auto border-t md:border-t-0 border-slate-100">
             <PriceFilter 
               minPrice={filters.minPrice} 
               maxPrice={filters.maxPrice} 
               onChange={handlePriceChange} 
             />
          </div>

          {/* Search Button (Visual Confirmation / Scroll) */}
          <div className="p-2 w-full md:w-auto">
             <button 
               onClick={() => {
                   // Optional: Scroll to results or just trigger a "refresh" visual? 
                   // Since filters apply on confirm, this is mostly symbolic or for location.
                   const listingSection = document.getElementById('listings');
                   if (listingSection) listingSection.scrollIntoView({ behavior: 'smooth' });
               }}
               className="w-full md:w-auto bg-terracotta-500 hover:bg-terracotta-600 text-white p-4 rounded-full shadow-lg shadow-terracotta-200 transition-all active:scale-95 flex items-center justify-center"
               aria-label="Search"
             >
               <MdSearch size={28} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
