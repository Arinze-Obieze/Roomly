'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters } from './filters/useFilters';
import { MdTune, MdKeyboardArrowDown, MdClose, MdLocationOn } from 'react-icons/md';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function FilterPills({ onOpenFilters }) {
  const { filters, updateFilters } = useFilters();
  const [activePill, setActivePill] = useState(null); // 'location' | 'price' | null
  const pillsRef = useRef(null);

  // Price State
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000]);
  
  // Location State
  const [locationInput, setLocationInput] = useState(filters.location || '');

  useEffect(() => {
    if (activePill === 'price') {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 5000]);
    }
    if (activePill === 'location') {
      setLocationInput(filters.location || '');
    }
  }, [activePill, filters]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (activePill && !event.target.closest('.filter-pill-content') && !event.target.closest('.filter-pill-trigger')) {
            setActivePill(null);
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
  };

  const getPriceLabel = () => {
    if (filters.minPrice && filters.maxPrice) return `€${filters.minPrice} - €${filters.maxPrice}`;
    if (filters.minPrice) return `Min €${filters.minPrice}`;
    if (filters.maxPrice) return `Max €${filters.maxPrice}`;
    return 'Price';
  };

  const getBedsLabel = () => {
    if (filters.minBedrooms) return `${filters.minBedrooms}+ Beds`;
    return 'Beds';
  };

  return (
    <div className="relative" ref={pillsRef}>
      <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
        {/* Tune / All Filters Button */}
        <button 
          onClick={onOpenFilters}
          className="shrink-0 p-2.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <MdTune size={20} />
        </button>

        {/* Location Pill */}
        <div className="relative">
            <button 
                onClick={() => setActivePill(activePill === 'location' ? null : 'location')}
                className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                filters.location 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
            >
                {filters.location || 'Location'}
                {!filters.location && <MdKeyboardArrowDown size={16} />}
            </button>
            
            {/* Location Dropdown (Fixed to avoid overflow clipping) */}
            {activePill === 'location' && (
                <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[300px] px-4 sm:px-0 z-50">
                    <form 
                        onSubmit={handleLocationSubmit}
                        className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-200"
                    >
                         <h3 className="font-bold text-slate-900 mb-3">Where to?</h3>
                         <div className="relative">
                            <MdLocationOn className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input 
                                autoFocus
                                type="text" 
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="City or area..."
                                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-medium"
                            />
                            {locationInput && (
                                <button 
                                    type="button"
                                    onClick={() => setLocationInput('')}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    <MdClose />
                                </button>
                            )}
                         </div>
                         <div className="flex justify-end gap-2 mt-4">
                             <button
                                type="button"
                                onClick={() => setActivePill(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg"
                             >
                                Cancel
                             </button>
                             <button
                                type="submit"
                                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                             >
                                Apply
                             </button>
                         </div>
                    </form>
                </div>
            )}
        </div>

        {/* Price Pill */}
        <div className="relative">
            <button 
                onClick={() => setActivePill(activePill === 'price' ? null : 'price')}
                className={`filter-pill-trigger shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                filters.minPrice || filters.maxPrice
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
            >
                {getPriceLabel()}
                {(!filters.minPrice && !filters.maxPrice) && <MdKeyboardArrowDown size={16} />}
            </button>

             {/* Price Dropdown */}
             {activePill === 'price' && (
                <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[340px] px-4 sm:px-0 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900">Price Range</h3>
                             <button onClick={() => setActivePill(null)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                                <MdClose />
                            </button>
                        </div>

                         {/* Range Inputs */}
                        <div className="flex gap-3 mb-6">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Min</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-xs">€</span>
                                    <input 
                                        type="number"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Max</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-xs">€</span>
                                    <input 
                                        type="number"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                        className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:border-cyan-500 outline-none"
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
                                railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
                                trackStyle={[{ backgroundColor: '#0891b2', height: 4 }]}
                                handleStyle={[
                                    { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
                                    { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 20, width: 20, marginTop: -8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                                ]}
                             />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                             <button
                                onClick={() => {
                                    setPriceRange([0, 5000]);
                                    updateFilters({ minPrice: '', maxPrice: '' });
                                    setActivePill(null);
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                             >
                                Reset
                             </button>
                             <button
                                onClick={handlePriceApply}
                                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10"
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
            ? 'bg-slate-900 border-slate-900 text-white' 
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        {filters.propertyType && filters.propertyType !== 'any' ? filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1) : 'Property Type'}
        {(!filters.propertyType || filters.propertyType === 'any') && <MdKeyboardArrowDown size={16} />}
      </button>

        {/* Property Type Dropdown */}
        {activePill === 'type' && (
            <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[260px] px-4 sm:px-0 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="space-y-1">
                        <button
                            onClick={() => {
                                updateFilters({ propertyType: 'any' });
                                setActivePill(null);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                                !filters.propertyType || filters.propertyType === 'any' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Any Type
                            {(!filters.propertyType || filters.propertyType === 'any') && <MdLocationOn size={0} className="w-2 h-2 rounded-full bg-cyan-600" />}
                        </button>
                        {[
                            { id: 'room', label: 'Private Room' },
                            { id: 'studio', label: 'Studio' },
                            { id: 'apartment', label: 'Apartment' },
                            { id: 'house', label: 'House' },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    updateFilters({ propertyType: opt.id });
                                    setActivePill(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                                    filters.propertyType === opt.id ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {opt.label}
                                {filters.propertyType === opt.id && <MdLocationOn size={0} className="w-2 h-2 rounded-full bg-cyan-600" />}
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
            ? 'bg-slate-900 border-slate-900 text-white' 
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        {getBedsLabel()}
        {!filters.minBedrooms && <MdKeyboardArrowDown size={16} />}
      </button>

        {/* Beds Dropdown */}
        {activePill === 'beds' && (
            <div className="filter-pill-content fixed left-0 sm:absolute sm:left-0 top-[140px] sm:top-full mt-2 w-full sm:w-[320px] px-4 sm:px-0 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900">Beds & Baths</h3>
                            <button onClick={() => setActivePill(null)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                            <MdClose />
                        </button>
                    </div>

                    {/* Beds Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bedrooms</label>
                        <div className="flex gap-2">
                        <button
                            onClick={() => updateFilters({ minBedrooms: 0 })}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                !filters.minBedrooms || filters.minBedrooms === 0
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {num}{num === 5 ? '+' : ''}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* Baths Section */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bathrooms</label>
                        <div className="flex gap-2">
                        <button
                            onClick={() => updateFilters({ minBathrooms: 0 })}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                !filters.minBathrooms || filters.minBathrooms === 0
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                {num}{num === 4 ? '+' : ''}
                            </button>
                        ))}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t border-slate-50">
                        <button 
                        onClick={() => setActivePill(null)}
                        className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors text-xs"
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
                className="shrink-0 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors px-2 underline"
            >
                Clear all
            </button>
        )}
      </div>
    </div>
  );
}
