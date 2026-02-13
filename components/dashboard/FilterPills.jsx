'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFilters } from './filters/useFilters';
import { MdTune, MdKeyboardArrowDown, MdClose, MdLocationOn } from 'react-icons/md';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { PROPERTY_CATEGORIES } from '@/data/listingOptions';
import { COUNTIES, DUBLIN_AREAS, CITIES_TOWNS } from '@/data/locations';

export default function FilterPills({ onOpenFilters }) {
  const { filters, updateFilters } = useFilters();
  const [activePill, setActivePill] = useState(null); // 'location' | 'price' | null
  const pillsRef = useRef(null);

  // Price State
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000]);
  
  // Location State
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Combine all locations for search
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

  useEffect(() => {
    if (activePill === 'price') {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 5000]);
    }
    if (activePill === 'location') {
      setLocationInput(filters.location || '');
      setShowSuggestions(true);
    }
  }, [activePill, filters]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (activePill && !event.target.closest('.filter-pill-content') && !event.target.closest('.filter-pill-trigger')) {
            setActivePill(null);
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePill]);

  const handlePriceApply = () => {
    updateFilters({ minPrice: priceRange[0], maxPrice: priceRange[1] });
    setActivePill(null);
  };

  const handleLocationSubmit = (e) => {
    e?.preventDefault();
    updateFilters({ location: locationInput });
    setActivePill(null);
    setShowSuggestions(false);
  };

  const selectLocation = (loc) => {
      setLocationInput(loc);
      updateFilters({ location: loc });
      setActivePill(null);
      setShowSuggestions(false);
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('en-IE');
  };

  const getPriceLabel = () => {
    if (filters.minPrice && filters.maxPrice) return `€${formatPrice(filters.minPrice)} - €${formatPrice(filters.maxPrice)}`;
    if (filters.minPrice) return `Min €${formatPrice(filters.minPrice)}`;
    if (filters.maxPrice) return `Max €${formatPrice(filters.maxPrice)}`;
    return 'Price';
  };

  const getBedsLabel = () => {
    if (filters.minBedrooms) return `${filters.minBedrooms}+ Beds`;
    return 'Beds';
  };

  const getPropertyTypeLabel = () => {
    if (filters.propertyType && filters.propertyType !== 'any') {
       const type = PROPERTY_CATEGORIES.find(t => t.value === filters.propertyType);
       return type ? type.label : filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1);
    }
    return 'Type';
  };

  return (
    <div className="relative" ref={pillsRef}>
      <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
        {/* Tune / All Filters Button */}
        <button 
          onClick={onOpenFilters}
          className="shrink-0 p-2.5 rounded-full border border-navy-200 bg-white text-navy-700 hover:bg-navy-50 transition-colors"
        >
          <MdTune size={20} />
        </button>

        {/* Location Pill */}
        <div className="relative">
            <button 
                onClick={() => setActivePill(activePill === 'location' ? null : 'location')}
                className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                filters.location 
                    ? 'bg-navy-900 border-navy-900 text-white' 
                    : 'bg-white border-navy-200 text-navy-700 hover:border-navy-300'
                }`}
            >
                {filters.location || 'Location'}
                {!filters.location && <MdKeyboardArrowDown size={16} />}
            </button>
            
            {/* Location Dropdown */}
            {activePill === 'location' && (
                <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[300px] px-4 sm:px-0 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-navy-100 p-4 animate-in fade-in zoom-in-95 duration-200">
                         <h3 className="font-bold text-navy-900 mb-3">Where to?</h3>
                         <form onSubmit={handleLocationSubmit} className="relative">
                            <MdLocationOn className="absolute left-3 top-3 text-navy-400" size={20} />
                            <input 
                                autoFocus
                                type="text" 
                                value={locationInput}
                                onChange={(e) => {
                                    setLocationInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="City, Area or County..."
                                className="w-full pl-10 pr-10 py-2.5 border border-navy-200 rounded-xl focus:ring-2 focus:ring-terracotta-500 outline-none text-sm font-medium bg-navy-50/50 focus:bg-white transition-colors"
                            />
                            {locationInput && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setLocationInput('');
                                        setShowSuggestions(true);
                                    }}
                                    className="absolute right-3 top-3 text-navy-400 hover:text-navy-600"
                                >
                                    <MdClose />
                                </button>
                            )}
                         </form>

                         {/* Suggestions List */}
                         {showSuggestions && (
                             <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1">
                                 {filteredLocations.map((loc, idx) => (
                                     <button
                                         key={idx}
                                         onClick={() => selectLocation(loc)}
                                         className="w-full flex items-center gap-3 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 rounded-lg transition-colors text-left"
                                     >
                                         <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                                            <MdLocationOn className="text-navy-500" size={14} />
                                         </div>
                                         <span className="font-medium">{loc}</span>
                                     </button>
                                 ))}
                                 {filteredLocations.length === 0 && (
                                     <div className="p-3 text-sm text-navy-400 text-center">
                                         No locations found
                                     </div>
                                 )}
                             </div>
                         )}
                         
                         <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-navy-50">
                             <button
                                type="button"
                                onClick={() => setActivePill(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-navy-500 hover:bg-navy-50 rounded-lg"
                             >
                                Cancel
                             </button>
                             <button
                                onClick={handleLocationSubmit}
                                className="px-4 py-1.5 bg-navy-900 text-white text-xs font-bold rounded-lg hover:bg-navy-800"
                             >
                                Apply
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>

        {/* Price Pill */}
        <div className="relative">
            <button 
                onClick={() => setActivePill(activePill === 'price' ? null : 'price')}
                className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                filters.minPrice || filters.maxPrice
                    ? 'bg-navy-900 border-navy-900 text-white' 
                    : 'bg-white border-navy-200 text-navy-700 hover:border-navy-300'
                }`}
            >
                {getPriceLabel()}
                {(!filters.minPrice && !filters.maxPrice) && <MdKeyboardArrowDown size={16} />}
            </button>

             {/* Price Dropdown */}
             {activePill === 'price' && (
                <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[340px] px-4 sm:px-0 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-navy-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-navy-900">Price Range</h3>
                             <button onClick={() => setActivePill(null)} className="p-1 hover:bg-navy-50 rounded-full text-navy-400">
                                <MdClose />
                            </button>
                        </div>

                         {/* Range Inputs */}
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Min</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-navy-400 text-xs">€</span>
                                    <input 
                                        type="number"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-full pl-6 pr-2 py-1.5 border border-navy-200 rounded-lg text-sm font-bold focus:border-terracotta-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Max</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-navy-400 text-xs">€</span>
                                    <input 
                                        type="number"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full pl-6 pr-2 py-1.5 border border-navy-200 rounded-lg text-sm font-bold focus:border-terracotta-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="px-2 mb-6">
                             <Slider
                                range
                                min={0}
                                max={5000}
                                step={50}
                                value={priceRange}
                                onChange={setPriceRange}
                                railStyle={{ backgroundColor: '#bcccdc', height: 4 }}
                                trackStyle={[{ backgroundColor: '#FF6B6B', height: 4 }]}
                                handleStyle={[
                                    { borderColor: '#FF6B6B', backgroundColor: 'white', opacity: 1, height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                                    { borderColor: '#FF6B6B', backgroundColor: 'white', opacity: 1, height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                                ]}
                             />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-navy-50">
                             <button
                                onClick={() => {
                                    setPriceRange([0, 5000]);
                                    updateFilters({ minPrice: '', maxPrice: '' });
                                    setActivePill(null);
                                }}
                                className="text-xs font-semibold text-navy-500 hover:text-navy-800"
                             >
                                Reset
                             </button>
                             <button
                                onClick={handlePriceApply}
                                className="px-5 py-2 bg-navy-900 text-white text-xs font-bold rounded-xl hover:bg-navy-800 shadow-lg shadow-navy-900/10"
                             >
                                Apply
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

      {/* Property Type Pill */}
      <div className="relative">
      <button 
        onClick={() => setActivePill(activePill === 'type' ? null : 'type')}
        className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            filters.propertyType && filters.propertyType !== 'any'
            ? 'bg-navy-900 border-navy-900 text-white' 
            : 'bg-white border-navy-200 text-navy-700 hover:border-navy-300'
        }`}
      >
        {getPropertyTypeLabel()}
        {(!filters.propertyType || filters.propertyType === 'any') && <MdKeyboardArrowDown size={16} />}
      </button>

        {/* Property Type Dropdown */}
        {activePill === 'type' && (
            <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[260px] max-h-[400px] overflow-y-auto px-4 sm:px-0 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-navy-100 p-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="space-y-1">
                        <button
                            onClick={() => {
                                updateFilters({ propertyType: 'any' });
                                setActivePill(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                                !filters.propertyType || filters.propertyType === 'any' ? 'bg-navy-50 text-navy-900' : 'text-navy-600 hover:bg-navy-50'
                            }`}
                        >
                            Any Type
                            {(!filters.propertyType || filters.propertyType === 'any') && <MdLocationOn size={0} className="w-2 h-2 rounded-full bg-terracotta-500" />}
                        </button>
                        {PROPERTY_CATEGORIES.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    updateFilters({ propertyType: opt.value });
                                    setActivePill(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                                    filters.propertyType === opt.value ? 'bg-navy-50 text-navy-900' : 'text-navy-600 hover:bg-navy-50'
                                }`}
                            >
                                {opt.label}
                                {filters.propertyType === opt.value && <MdLocationOn size={0} className="w-2 h-2 rounded-full bg-terracotta-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Beds Pill */}
      <div className="relative">
      <button 
        onClick={() => setActivePill(activePill === 'beds' ? null : 'beds')}
        className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
          filters.minBedrooms
            ? 'bg-navy-900 border-navy-900 text-white' 
            : 'bg-white border-navy-200 text-navy-700 hover:border-navy-300'
        }`}
      >
        {getBedsLabel()}
        {!filters.minBedrooms && <MdKeyboardArrowDown size={16} />}
      </button>

        {/* Beds Dropdown */}
        {activePill === 'beds' && (
            <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[320px] px-4 sm:px-0 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-navy-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-navy-900">Beds & Baths</h3>
                            <button onClick={() => setActivePill(null)} className="p-1 hover:bg-navy-50 rounded-full text-navy-400">
                            <MdClose />
                        </button>
                    </div>

                    {/* Beds Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-navy-500 uppercase mb-2">Bedrooms</label>
                        <div className="flex gap-2">
                        <button
                            onClick={() => updateFilters({ minBedrooms: 0 })}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                !filters.minBedrooms || filters.minBedrooms === 0
                                ? 'bg-navy-900 text-white border-navy-900' 
                                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300'
                            }`}
                        >
                            Any
                        </button>
                        {[1, 2, 3, 4, 5].map(num => (
                            <button
                                key={num}
                                onClick={() => updateFilters({ minBedrooms: num })}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                filters.minBedrooms === num
                                ? 'bg-navy-900 text-white border-navy-900' 
                                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300'
                                }`}
                            >
                                {num}{num === 5 ? '+' : ''}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* Baths Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-navy-500 uppercase mb-2">Bathrooms</label>
                        <div className="flex gap-2">
                        <button
                            onClick={() => updateFilters({ minBathrooms: 0 })}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                !filters.minBathrooms || filters.minBathrooms === 0
                                ? 'bg-navy-900 text-white border-navy-900' 
                                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300'
                            }`}
                        >
                            Any
                        </button>
                        {[1, 2, 3, 4].map(num => (
                            <button
                                key={num}
                                onClick={() => updateFilters({ minBathrooms: num })}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                filters.minBathrooms === num
                                ? 'bg-navy-900 text-white border-navy-900' 
                                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300'
                                }`}
                            >
                                {num}{num === 4 ? '+' : ''}
                            </button>
                        ))}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t border-navy-50">
                        <button 
                        onClick={() => setActivePill(null)}
                        className="bg-navy-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-navy-800 transition-colors text-xs"
                        >
                        Done
                        </button>
                    </div>

                </div>
            </div>
        )}
      </div>

        {/* Clear All Button */}
        {(Object.keys(filters).length > 0 && Object.values(filters).some(v => v !== '' && v !== 'any' && v !== null && v !== 0)) && (
            <button 
                onClick={() => updateFilters({ 
                    location: '', 
                    minPrice: '', 
                    maxPrice: '', 
                    propertyType: 'any', 
                    minBedrooms: 0, 
                    minBathrooms: 0 
                })}
                className="shrink-0 text-xs font-bold text-navy-500 hover:text-terracotta-500 transition-colors px-2 underline"
            >
                Clear all
            </button>
        )}
      </div>
    </div>
  );
}
