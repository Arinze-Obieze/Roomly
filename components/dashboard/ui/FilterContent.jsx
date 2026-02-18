"use client";

import { useState, useMemo } from 'react';
import { 
  MdLocationOn, 
  MdOutlineAttachMoney, 
  MdVerified, 
  MdMap,
  MdKeyboardArrowDown,
  MdSearch,
  MdFilterList,
  MdClose
} from "react-icons/md";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { FilterSection } from "./FilterSection";
import { useFilters } from "@/components/dashboard/filters/useFilters";
import { AMENITIES } from "@/data/amenities";
import { DEAL_BREAKERS, LIFESTYLE_PRIORITIES, PROPERTY_CATEGORIES } from "@/data/listingOptions";
import { COUNTIES, DUBLIN_AREAS, CITIES_TOWNS } from '@/data/locations';

export const FilterContent = ({ variant }) => {
  const { filters, updateFilters } = useFilters();
  const isSidebar = variant === 'sidebar';

  // --- Location Logic ---
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allLocations = useMemo(() => {
    return [...new Set([...DUBLIN_AREAS, ...CITIES_TOWNS, ...COUNTIES])].sort();
  }, []);

  const filteredLocations = useMemo(() => {
    if (!locationInput) return allLocations.slice(0, 10);
    const search = locationInput.toLowerCase();
    return allLocations.filter(loc => 
        loc.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [locationInput, allLocations]);

  const handleLocationSubmit = (e) => {
    e?.preventDefault();
    updateFilters({ location: locationInput });
    setShowSuggestions(false);
  };

  const selectLocation = (loc) => {
      setLocationInput(loc);
      updateFilters({ location: loc });
      setShowSuggestions(false);
  };

  // --- Price Logic ---
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000]);

  const handlePriceChange = (val) => {
    setPriceRange(val);
  };

  const handlePriceAfterChange = (val) => {
    updateFilters({ minPrice: val[0], maxPrice: val[1] });
  };

  // --- Keywords ---
  const handleKeywordChange = (e) => {
    // Debounce this in a real app
    updateFilters({ searchQuery: e.target.value });
  };

  return (
    <div className={`${isSidebar ? 'p-4 pb-20' : 'p-6 space-y-8 pb-32'}`}>
      
      {/* Sidebar Header / Summary */}
      {isSidebar && (
        <div className="mb-6 p-3 bg-navy-50 rounded-xl border border-navy-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-navy-900 text-sm">Current Search</h3>
            <span className="text-[10px] uppercase font-bold bg-terracotta-50 text-terracotta-700 px-2 py-1 rounded-full">
              {filters.location || 'All Ireland'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-navy-500">
              <MdLocationOn className="text-terracotta-500" size={14} />
              <span className="truncate">{filters.location || 'Any Location'} • {filters.bedrooms?.length > 0 ? `${filters.bedrooms.join(', ')} bed` : 'Any bed'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-navy-500">
              <MdOutlineAttachMoney className="text-terracotta-500" size={14} />
              <span>
                {filters.minPrice || filters.maxPrice 
                  ? `€${filters.minPrice || 0} - €${filters.maxPrice || 'Any'}` 
                  : 'Any Price'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Search */}
      {!isSidebar && (
        <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input 
                type="text" 
                placeholder="Search keywords..." 
                className="w-full pl-10 pr-4 py-3 bg-navy-50 border border-navy-100 rounded-xl focus:ring-2 focus:ring-terracotta-100 focus:border-terracotta-500 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                onChange={handleKeywordChange}
                value={filters.searchQuery || ''}
            />
        </div>
      )}

      {/* Location Filter */}
      <FilterSection title="Location" isSidebar={isSidebar} defaultOpen={true}>
        <div className="relative">
            <form onSubmit={handleLocationSubmit} className="relative">
                <MdLocationOn className="absolute left-3 top-3 text-navy-400" size={18} />
                <input 
                    type="text" 
                    value={locationInput}
                    onChange={(e) => {
                        setLocationInput(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    // onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay for click match
                    placeholder="City, Area or County..."
                    className="w-full pl-9 pr-9 py-2.5 border border-navy-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 outline-none text-sm font-medium bg-white transition-colors text-navy-900 placeholder:text-navy-400"
                />
                {locationInput && (
                    <button 
                        type="button"
                        onClick={() => {
                            setLocationInput('');
                            updateFilters({ location: '' });
                            setShowSuggestions(true);
                        }}
                        className="absolute right-3 top-3 text-navy-400 hover:text-navy-600"
                    >
                        <MdClose size={16} />
                    </button>
                )}
            </form>
            
            {/* Suggestions List */}
            {showSuggestions && (
                <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-navy-100 bg-white border border-navy-100 rounded-xl p-1 shadow-lg z-10 relative">
                    {filteredLocations.map((loc, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => selectLocation(loc)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 rounded-lg transition-colors text-left group"
                        >
                            <MdLocationOn className="text-navy-300 group-hover:text-terracotta-500" size={14} />
                            <span className="font-medium truncate">{loc}</span>
                        </button>
                    ))}
                    {filteredLocations.length === 0 && (
                        <div className="p-3 text-xs text-navy-400 text-center">
                            No locations found
                        </div>
                    )}
                </div>
            )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price (Monthly)" isSidebar={isSidebar} defaultOpen={true}>
         <div className="mb-4 flex gap-3">
            <div className="flex-1">
                <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Min</label>
                <div className="relative">
                    <span className="absolute left-2 top-2 text-navy-400 text-xs font-bold">€</span>
                    <input 
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setPriceRange([val, priceRange[1]]);
                            updateFilters({ minPrice: val });
                        }}
                        className="w-full pl-5 pr-2 py-1.5 border border-navy-200 rounded-lg text-sm font-bold focus:border-terracotta-500 outline-none text-navy-900"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Max</label>
                <div className="relative">
                    <span className="absolute left-2 top-2 text-navy-400 text-xs font-bold">€</span>
                    <input 
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setPriceRange([priceRange[0], val]);
                            updateFilters({ maxPrice: val });
                        }}
                        className="w-full pl-5 pr-2 py-1.5 border border-navy-200 rounded-lg text-sm font-bold focus:border-terracotta-500 outline-none text-navy-900"
                    />
                </div>
            </div>
         </div>
         <div className="px-2">
            <Slider
                range
                min={0}
                max={5000}
                step={50}
                value={priceRange}
                onChange={handlePriceChange}
                onAfterChange={handlePriceAfterChange}
                railStyle={{ backgroundColor: '#E2E8F0', height: 4 }} 
                trackStyle={[{ backgroundColor: '#FF6B6B', height: 4 }]} 
                handleStyle={[
                    { borderColor: '#FF6B6B', backgroundColor: 'white', opacity: 1, height: 16, width: 16, marginTop: -6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                    { borderColor: '#FF6B6B', backgroundColor: 'white', opacity: 1, height: 16, width: 16, marginTop: -6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                ]}
            />
         </div>
      </FilterSection>

      <FilterSection title="Property Type" isSidebar={isSidebar} defaultOpen={true}>
         <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => updateFilters({ propertyType: 'any' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all border ${
                    !filters.propertyType || filters.propertyType === 'any'
                    ? 'bg-navy-900 border-navy-900 text-white' 
                    : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                }`}
            >
                Any
            </button>
            {PROPERTY_CATEGORIES.map(type => (
                 <button
                    key={type.value}
                    onClick={() => updateFilters({ propertyType: filters.propertyType === type.value ? 'any' : type.value })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all border ${
                        filters.propertyType === type.value 
                        ? 'bg-navy-900 border-navy-900 text-white' 
                        : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                >
                    {type.label}
                </button>
            ))}
         </div>
      </FilterSection>

      <FilterSection title="Bedrooms" isSidebar={isSidebar}>
        {/* Bedrooms */}
        <div className="mb-4">
            <label className="text-[10px] font-bold text-navy-500 uppercase mb-2 block">Minimum Beds</label>
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((num) => (
                    <button
                    key={num}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        (num === 0 && !filters.minBedrooms) || filters.minBedrooms === num
                        ? 'bg-navy-900 text-white border-navy-900' 
                        : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300 hover:bg-navy-50'
                    }`}
                    onClick={() => updateFilters({ minBedrooms: num })}
                    >
                    {num === 0 ? 'Any' : `${num}+`}
                    </button>
                ))}
            </div>
        </div>
        
        {/* Bathrooms */}
        <div>
            <label className="text-[10px] font-bold text-navy-500 uppercase mb-2 block">Minimum Baths</label>
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((num) => (
                    <button
                    key={num}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        (num === 0 && !filters.minBathrooms) || filters.minBathrooms === num
                        ? 'bg-navy-900 text-white border-navy-900' 
                        : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300 hover:bg-navy-50'
                    }`}
                    onClick={() => updateFilters({ minBathrooms: num })}
                    >
                    {num === 0 ? 'Any' : `${num}+`}
                    </button>
                ))}
            </div>
        </div>
      </FilterSection>

      <FilterSection title="House Rules" isSidebar={isSidebar}>
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-navy-900 mb-2 block">Lifestyle Match</label>
                <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_PRIORITIES.map(item => (
                        <button
                            key={item.id}
                            className="px-3 py-1.5 rounded-full border border-navy-200 text-[10px] font-bold text-navy-600 hover:bg-navy-50 uppercase tracking-wide"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                {DEAL_BREAKERS.map(db => (
                        <label key={db.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input type="checkbox" className="peer w-4 h-4 border-2 border-navy-200 rounded text-terracotta-600 focus:ring-terracotta-500 focus:ring-offset-0" />
                        </div>
                        <span className="text-sm text-navy-600 group-hover:text-navy-900 transition-colors font-medium">{db.label}</span>
                        </label>
                ))}
            </div>
        </div>
      </FilterSection>

      <FilterSection title="Amenities" isSidebar={isSidebar}>
        <div className="space-y-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity.value} className="flex items-center justify-between p-2 hover:bg-navy-50 rounded-lg cursor-pointer transition-colors group">
              <div className="flex items-center gap-3">
                <amenity.icon className="text-navy-400 group-hover:text-terracotta-500 transition-colors" size={16} />
                <span className="text-sm font-medium text-navy-700">{amenity.label}</span>
              </div>
              <input
                type="checkbox"
                checked={filters.amenities?.includes(amenity.value)}
                onChange={(e) => {
                  const amenityKey = amenity.value;
                  const currentAmenities = filters.amenities || [];
                  const newAmenities = e.target.checked
                    ? [...currentAmenities, amenityKey]
                    : currentAmenities.filter(a => a !== amenityKey);
                  updateFilters({ amenities: newAmenities });
                }}
                className="w-4 h-4 rounded border-navy-300 text-terracotta-600 focus:ring-terracotta-500"
              />
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};