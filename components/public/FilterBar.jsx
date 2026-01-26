'use client';

import { useState } from 'react';
import { MdFilterList, MdKeyboardArrowDown, MdCheck } from 'react-icons/md';

export default function FilterBar({ filters = {}, onFilterChange }) {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const updateAndClose = (key, value) => {
    onFilterChange(key, value);
    setActiveDropdown(null);
  };

  const PRICE_RANGES = [
    { id: 'all', label: 'Any Price' },
    { id: 'budget', label: 'Budget (< €800)' },
    { id: 'mid', label: 'Standard (€800 - €1500)' },
    { id: 'premium', label: 'Premium (> €1500)' }
  ];

  const BEDROOMS = [1, 2, 3, 4];

  return (
    <div className="sticky top-[72px] z-40 bg-white border-b border-slate-200 py-3 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        
        {/* Price Filter */}
        <div className="relative shrink-0">
          <button 
            onClick={() => toggleDropdown('price')}
            className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all ${
               filters.priceRange && filters.priceRange !== 'all' 
               ? 'bg-slate-900 text-white border-slate-900' 
               : 'bg-white border-slate-300 text-slate-700 hover:border-slate-800'
            }`}
          >
            Price
            <MdKeyboardArrowDown size={18} />
          </button>
          
          {activeDropdown === 'price' && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
               <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => updateAndClose('priceRange', range.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
                        filters.priceRange === range.id ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {range.label}
                      {filters.priceRange === range.id && <MdCheck className="text-cyan-600" />}
                    </button>
                  ))}
               </div>
             </>
          )}
        </div>

        {/* Property Type Filter */}
        <div className="relative shrink-0">
          <button 
            onClick={() => toggleDropdown('type')}
            className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all ${
               filters.propertyType && filters.propertyType !== 'any'
               ? 'bg-slate-900 text-white border-slate-900' 
               : 'bg-white border-slate-300 text-slate-700 hover:border-slate-800'
            }`}
          >
            Type
            <MdKeyboardArrowDown size={18} />
          </button>
          
          {activeDropdown === 'type' && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
               <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  {['any', 'apartment', 'house', 'studio', 'shared'].map(type => (
                    <button
                      key={type}
                      onClick={() => updateAndClose('propertyType', type)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium capitalize flex items-center justify-between ${
                        filters.propertyType === type ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'any' ? 'Any Type' : type}
                      {filters.propertyType === type && <MdCheck className="text-cyan-600" />}
                    </button>
                  ))}
               </div>
             </>
          )}
        </div>

        {/* Bedrooms Filter */}
        <div className="relative shrink-0">
            <button 
                onClick={() => toggleDropdown('bedrooms')}
                className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all ${
                    filters.bedrooms?.length > 0 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-800'
                }`}
            >
                Bedrooms
                <MdKeyboardArrowDown size={18} />
            </button>

            {activeDropdown === 'bedrooms' && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={() => updateAndClose('bedrooms', [])}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
                             !filters.bedrooms || filters.bedrooms.length === 0 ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Any
                        {(!filters.bedrooms || filters.bedrooms.length === 0) && <MdCheck className="text-cyan-600" />}
                    </button>
                    {BEDROOMS.map(num => (
                        <button
                        key={num}
                        onClick={() => {
                            // Toggle logic for array
                            const current = filters.bedrooms || [];
                            const updated = current.includes(num)
                                ? current.filter(n => n !== num)
                                : [...current, num];
                            onFilterChange('bedrooms', updated);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
                            filters.bedrooms?.includes(num) ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        >
                        {num}+ Beds
                        {filters.bedrooms?.includes(num) && <MdCheck className="text-cyan-600" />}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>

        <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

        {/* Verified Toggle */}
        <button 
          onClick={() => onFilterChange('verifiedOnly', !filters.verifiedOnly)}
          className={`shrink-0 px-4 py-2 rounded-full border text-sm font-semibold transition-all flex items-center gap-2 ${
            filters.verifiedOnly 
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
              : 'bg-white border-slate-300 text-slate-700 hover:border-slate-800'
          }`}
        >
          Verified Only
          {filters.verifiedOnly && <MdCheck size={16} />}
        </button>

        {/* All Filters Trigger (Placeholder for now) */}
        <button className="shrink-0 ml-auto px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <MdFilterList size={18} />
            <span className="hidden sm:inline">More Filters</span>
        </button>

      </div>
    </div>
  );
}
