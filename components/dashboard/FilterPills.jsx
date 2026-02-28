'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFilters } from './filters/useFilters';
import { MdTune, MdKeyboardArrowDown, MdClose, MdLocationOn, MdAttachMoney, MdHome, MdBed } from 'react-icons/md';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { PROPERTY_CATEGORIES } from '@/data/listingOptions';
import { COUNTIES, DUBLIN_AREAS, CITIES_TOWNS } from '@/data/locations';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilterPills({ onOpenFilters }) {
  const { filters, updateFilters } = useFilters();
  const [activePill, setActivePill] = useState(null);
  const pillsRef = useRef(null);
  const [draftPropertyTypes, setDraftPropertyTypes] = useState([]);

  // Price State
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000]);
  
  // Location State
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allLocations = useMemo(() => {
    return [...new Set([...DUBLIN_AREAS, ...CITIES_TOWNS, ...COUNTIES])].sort();
  }, []);

  const filteredLocations = useMemo(() => {
    if (!locationInput) return allLocations.slice(0, 8);
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
    if (activePill === 'type') {
      const currentTypes = filters.propertyTypes?.length > 0
        ? filters.propertyTypes
        : (filters.propertyType && filters.propertyType !== 'any' ? [filters.propertyType] : []);
      setDraftPropertyTypes(currentTypes);
    }
  }, [activePill, filters]);

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

  const formatPrice = (price) => price?.toLocaleString('en-IE');

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
    const selected = filters.propertyTypes?.length > 0
      ? filters.propertyTypes
      : (filters.propertyType && filters.propertyType !== 'any' ? [filters.propertyType] : []);
    if (selected.length === 1) {
       const type = PROPERTY_CATEGORIES.find(t => t.value === selected[0]);
       return type ? type.label : selected[0];
    }
    if (selected.length > 1) {
      return `${selected.length} Types`;
    }
    return 'Type';
  };

  const hasActiveFilters = (() => {
    const values = Object.values(filters);
    return values.some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (value === null || value === undefined) return false;
      return value !== '' && value !== 'any' && value !== 0 && value !== 'all' && value !== 'recommended';
    });
  })();

  const isTypeFilterActive = (() => {
    const selected = filters.propertyTypes?.length > 0
      ? filters.propertyTypes
      : (filters.propertyType && filters.propertyType !== 'any' ? [filters.propertyType] : []);
    return selected.length > 0;
  })();

  return (
    <div className="relative static max-md:static z-[250]" ref={pillsRef}>
      <div className="flex flex-wrap items-center gap-2 pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        {/* All Filters Button */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenFilters}
          className="shrink-0 p-2.5 rounded-full border border-navy-200 bg-white text-navy-700 hover:bg-navy-50 transition-colors shadow-sm"
        >
          <MdTune size={20} />
        </motion.button>

        {/* Location Pill */}
        <div className="relative max-md:static">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActivePill(activePill === 'location' ? null : 'location')}
            className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-heading font-medium transition-all ${
              filters.location 
                ? 'bg-navy-950 border-navy-950 text-white shadow-md shadow-navy-950/20' 
                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            <MdLocationOn size={16} className={filters.location ? 'text-white' : 'text-navy-400'} />
            {filters.location || 'Location'}
            {!filters.location && <MdKeyboardArrowDown size={14} className="text-navy-400" />}
          </motion.button>
          
          <AnimatePresence>
            {activePill === 'location' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="filter-pill-content absolute left-0 mt-2 z-[400] max-md:fixed max-md:z-[999] max-md:inset-0 max-md:m-auto max-md:h-fit max-md:w-[calc(100vw-2rem)] max-md:max-w-sm max-md:mt-0 md:top-full md:w-[320px]"
              >
                {/* Mobile Overlay */}
                <div className="md:hidden fixed inset-0 bg-navy-900/60 backdrop-blur-sm -z-10" onClick={() => setActivePill(null)} />
                
                <div className="bg-white rounded-2xl shadow-xl border border-navy-200 p-4">
                  <h3 className="font-heading font-bold text-navy-950 mb-3">Where to?</h3>
                  <form onSubmit={handleLocationSubmit} className="relative">
                    <MdLocationOn className="absolute left-3 top-3 text-navy-400" size={18} />
                    <input 
                      autoFocus
                      type="text" 
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="City, area or county..."
                      className="w-full pl-9 pr-9 py-2.5 border border-navy-200 rounded-xl focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 outline-none text-sm bg-navy-50/30"
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
                        <MdClose size={16} />
                      </button>
                    )}
                  </form>

                  {showSuggestions && (
                    <div className="mt-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-navy-200 space-y-1">
                      {filteredLocations.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectLocation(loc)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 rounded-xl transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-navy-50 flex items-center justify-center shrink-0">
                            <MdLocationOn className="text-navy-400" size={14} />
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
                  
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-navy-100">
                    <button
                      type="button"
                      onClick={() => setActivePill(null)}
                      className="px-3 py-1.5 text-xs font-medium text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLocationSubmit}
                      className="px-4 py-1.5 bg-navy-950 text-white text-xs font-bold rounded-lg hover:bg-navy-900 shadow-lg shadow-navy-950/20 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Pill */}
        <div className="relative max-md:static">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActivePill(activePill === 'price' ? null : 'price')}
            className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-heading font-medium transition-all ${
              filters.minPrice || filters.maxPrice
                ? 'bg-navy-950 border-navy-950 text-white shadow-md shadow-navy-950/20' 
                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            <MdAttachMoney size={16} className={filters.minPrice || filters.maxPrice ? 'text-white' : 'text-navy-400'} />
            {getPriceLabel()}
            {(!filters.minPrice && !filters.maxPrice) && <MdKeyboardArrowDown size={14} className="text-navy-400" />}
          </motion.button>

          <AnimatePresence>
            {activePill === 'price' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="filter-pill-content absolute z-[400] max-md:fixed max-md:z-[999] max-md:inset-0 max-md:m-auto max-md:h-fit max-md:w-[calc(100vw-2rem)] max-md:max-w-md md:mt-2 md:top-full md:left-1/2 md:-translate-x-1/2 md:w-[340px]"
              >
                {/* Mobile Overlay */}
                <div className="md:hidden fixed inset-0 bg-navy-900/60 backdrop-blur-sm -z-10" onClick={() => setActivePill(null)} />
                <div className="bg-white rounded-2xl shadow-xl border border-navy-200 p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-heading font-bold text-navy-950">Price Range</h3>
                    <button onClick={() => setActivePill(null)} className="p-1 hover:bg-navy-50 rounded-full text-navy-400">
                      <MdClose size={18} />
                    </button>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Min</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-navy-400 text-xs">€</span>
                        <input 
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-full pl-7 pr-2 py-2 border border-navy-200 rounded-xl text-sm focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-navy-500 uppercase mb-1">Max</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-navy-400 text-xs">€</span>
                        <input 
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full pl-7 pr-2 py-2 border border-navy-200 rounded-xl text-sm focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-1 mb-6">
                    <Slider
                      range
                      min={0}
                      max={5000}
                      step={50}
                      value={priceRange}
                      onChange={setPriceRange}
                      railStyle={{ backgroundColor: '#E2E8F0', height: 4 }} 
                      trackStyle={[{ backgroundColor: '#FF6B6B', height: 4 }]} 
                      handleStyle={[
                        { borderColor: '#FF6B6B', backgroundColor: 'white', height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)' },
                        { borderColor: '#FF6B6B', backgroundColor: 'white', height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)' }
                      ]}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-navy-100">
                    <button
                      onClick={() => {
                        setPriceRange([0, 5000]);
                        updateFilters({ minPrice: '', maxPrice: '' });
                        setActivePill(null);
                      }}
                      className="text-xs font-medium text-navy-500 hover:text-navy-800 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handlePriceApply}
                      className="px-5 py-2 bg-navy-950 text-white text-xs font-bold rounded-xl hover:bg-navy-900 shadow-lg shadow-navy-950/20 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Property Type Pill */}
        <div className="relative max-md:static">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActivePill(activePill === 'type' ? null : 'type')}
            className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-heading font-medium transition-all ${
              isTypeFilterActive
                ? 'bg-navy-950 border-navy-950 text-white shadow-md shadow-navy-950/20' 
                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            <MdHome size={16} className={isTypeFilterActive ? 'text-white' : 'text-navy-400'} />
            {getPropertyTypeLabel()}
            {!isTypeFilterActive && <MdKeyboardArrowDown size={14} className="text-navy-400" />}
          </motion.button>

          <AnimatePresence>
            {activePill === 'type' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="filter-pill-content absolute mt-2 z-[400] max-md:fixed max-md:z-[999] max-md:inset-0 max-md:m-auto max-md:h-fit max-md:w-[calc(100vw-2rem)] max-md:max-w-sm max-md:mt-0 md:top-full md:left-1/2 md:-translate-x-1/2 md:w-[300px]"
              >
                {/* Mobile Overlay */}
                <div className="md:hidden fixed inset-0 bg-navy-900/60 backdrop-blur-sm -z-10" onClick={() => setActivePill(null)} />

                <div className="bg-white rounded-2xl shadow-xl border border-navy-200 p-3">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setDraftPropertyTypes([]);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                        draftPropertyTypes.length === 0
                          ? 'bg-navy-50 text-navy-900 font-bold' 
                          : 'text-navy-600 hover:bg-navy-50'
                      }`}
                    >
                      Any Type
                      {draftPropertyTypes.length === 0 && (
                        <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                      )}
                    </button>
                    {PROPERTY_CATEGORIES.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDraftPropertyTypes((prev) => (
                            prev.includes(opt.value)
                              ? prev.filter((value) => value !== opt.value)
                              : [...prev, opt.value]
                          ));
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                          draftPropertyTypes.includes(opt.value)
                            ? 'bg-navy-50 text-navy-900 font-bold' 
                            : 'text-navy-600 hover:bg-navy-50'
                        }`}
                      >
                        {opt.label}
                        {draftPropertyTypes.includes(opt.value) && (
                          <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-3 border-t border-navy-100">
                    <button
                      onClick={() => setActivePill(null)}
                      className="px-3 py-1.5 text-xs font-medium text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        updateFilters({
                          propertyTypes: draftPropertyTypes,
                          propertyType: draftPropertyTypes.length === 1 ? draftPropertyTypes[0] : 'any'
                        });
                        setActivePill(null);
                      }}
                      className="px-4 py-1.5 bg-navy-950 text-white text-xs font-bold rounded-lg hover:bg-navy-900 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Beds Pill */}
        <div className="relative max-md:static">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActivePill(activePill === 'beds' ? null : 'beds')}
            className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-heading font-medium transition-all ${
              filters.minBedrooms
                ? 'bg-navy-950 border-navy-950 text-white shadow-md shadow-navy-950/20' 
                : 'bg-white border-navy-200 text-navy-600 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            <MdBed size={16} className={filters.minBedrooms ? 'text-white' : 'text-navy-400'} />
            {getBedsLabel()}
            {!filters.minBedrooms && <MdKeyboardArrowDown size={14} className="text-navy-400" />}
          </motion.button>

          <AnimatePresence>
            {activePill === 'beds' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="filter-pill-content absolute z-[400] max-md:fixed max-md:z-[999] max-md:inset-0 max-md:m-auto max-md:h-fit max-md:w-[calc(100vw-2rem)] max-md:max-w-md md:mt-2 md:top-full md:left-1/2 md:-translate-x-1/2 md:w-[340px]"
              >
                {/* Mobile Overlay */}
                <div className="md:hidden fixed inset-0 bg-navy-900/60 backdrop-blur-sm -z-10" onClick={() => setActivePill(null)} />

                <div className="bg-white rounded-2xl shadow-xl border border-navy-200 p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-heading font-bold text-navy-950">Beds & Baths</h3>
                    <button onClick={() => setActivePill(null)} className="p-1 hover:bg-navy-50 rounded-full text-navy-400">
                      <MdClose size={18} />
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-navy-500 uppercase mb-3">Bedrooms</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilters({ minBedrooms: 0 })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          !filters.minBedrooms || filters.minBedrooms === 0
                            ? 'bg-navy-950 text-white border-navy-950 shadow-md' 
                            : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-900'
                        }`}
                      >
                        Any
                      </button>
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => updateFilters({ minBedrooms: num })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            filters.minBedrooms === num
                              ? 'bg-navy-950 text-white border-navy-950 shadow-md' 
                              : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-900'
                          }`}
                        >
                          {num}{num === 5 ? '+' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-navy-500 uppercase mb-3">Bathrooms</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilters({ minBathrooms: 0 })}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          !filters.minBathrooms || filters.minBathrooms === 0
                            ? 'bg-navy-950 text-white border-navy-950 shadow-md' 
                            : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-900'
                        }`}
                      >
                        Any
                      </button>
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => updateFilters({ minBathrooms: num })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            filters.minBathrooms === num
                              ? 'bg-navy-950 text-white border-navy-950 shadow-md' 
                              : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-900'
                          }`}
                        >
                          {num}{num === 4 ? '+' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-navy-100">
                    <button 
                      onClick={() => setActivePill(null)}
                      className="px-5 py-2 bg-navy-950 text-white rounded-xl font-bold hover:bg-navy-900 transition-all text-xs shadow-lg shadow-navy-950/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => updateFilters({ 
              location: '', 
              minPrice: '', 
              maxPrice: '', 
              propertyType: 'any',
              propertyTypes: [],
              minBedrooms: 0, 
              minBathrooms: 0,
              sortBy: 'recommended'
            })}
            className="shrink-0 text-xs font-medium text-navy-500 hover:text-terracotta-500 transition-colors px-2 underline decoration-navy-200 hover:decoration-terracotta-500"
          >
            Clear all
          </motion.button>
        )}
      </div>
    </div>
  );
}
