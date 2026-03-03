'use client';

import { useState, useCallback } from 'react';
import LocationFilter from './filters/LocationFilter';
import PriceFilter from './filters/PriceFilter';
import BedsBathsFilter from './filters/BedsBathsFilter';
import PropertyTypeFilter from './filters/PropertyTypeFilter';
import AdvancedFilters from './AdvancedFilters';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MdSearch, MdTune } from 'react-icons/md';

export default function FilterBar({ filters = {}, onFilterChange, className = '', isSticky = true, publicMode = false }) {
  const router = useRouter();
  
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
      onFilterChange('propertyTypes', val);
  };

  const handleAdvancedFilterApply = (newFilters) => {
      // Advanced Filters returns a full filters object. We need to iterate and apply each.
      Object.entries(newFilters).forEach(([key, value]) => {
          onFilterChange(key, value);
      });
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
          <div className="w-full md:w-auto md:border-l-0 border-t md:border-t-0 border-slate-100 hidden md:block">
             <PropertyTypeFilter 
               values={filters.propertyTypes?.length > 0 ? filters.propertyTypes : (filters.propertyType && filters.propertyType !== 'any' ? [filters.propertyType] : [])} 
               onChange={handleTypeChange} 
             />
          </div>

          {/* Beds & Baths */}
          <div className="w-full md:w-auto border-t md:border-t-0 border-slate-100 hidden md:block">
             <BedsBathsFilter 
               beds={filters.minBedrooms} 
               baths={filters.minBathrooms} 
               onChange={handleBedsBathsChange} 
             />
          </div>

          {/* Price */}
          <div className="w-full md:w-auto border-t md:border-t-0 border-slate-100 hidden lg:block">
             <PriceFilter 
               minPrice={filters.minPrice} 
               maxPrice={filters.maxPrice} 
               onChange={handlePriceChange} 
             />
          </div>

          {/* Advanced Filters (Mobile: Modal | Desktop: Panel) */}
          <div className="w-full md:w-auto border-t md:border-t-0 border-slate-100 flex items-center justify-between p-2 md:p-3">
             {publicMode ? (
               <button 
                 onClick={() => {
                   toast.error('Sign up to unlock advanced filters!', {
                     icon: '🔒',
                     style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
                   });
                   setTimeout(() => router.push('/signup'), 1500);
                 }}
                 className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all"
               >
                 <MdTune size={18} />
                 <span>Filters</span>
               </button>
             ) : (
               <>
                 <div className="md:hidden">
                   <AdvancedFilters 
                     filters={filters} 
                     onApply={handleAdvancedFilterApply} 
                     mode="modal" 
                   />
                 </div>
                 <div className="hidden md:block">
                   <AdvancedFilters 
                     filters={filters} 
                     onApply={handleAdvancedFilterApply} 
                     mode="panel" 
                   />
                 </div>
               </>
             )}

             <button 
               onClick={() => {
                   const listingSection = document.getElementById('listings');
                   if (listingSection) listingSection.scrollIntoView({ behavior: 'smooth' });
               }}
               className="md:hidden bg-terracotta-500 hover:bg-terracotta-600 text-white p-3 rounded-full shadow-lg shadow-terracotta-200 transition-all active:scale-95 flex items-center justify-center ml-2"
               aria-label="Search"
             >
               <MdSearch size={24} />
             </button>
             <button 
               onClick={() => {
                   const listingSection = document.getElementById('listings');
                   if (listingSection) listingSection.scrollIntoView({ behavior: 'smooth' });
               }}
               className="hidden md:flex ml-2 bg-terracotta-500 hover:bg-terracotta-600 text-white p-3.5 rounded-full shadow-lg shadow-terracotta-200 transition-all active:scale-95 items-center justify-center"
               aria-label="Search"
             >
               <MdSearch size={22} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
