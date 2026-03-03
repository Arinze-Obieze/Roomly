'use client';

import { useState, useRef, useEffect } from "react";
import { useFilters } from "./filters/useFilters";
import { MdSort, MdTune, MdClose } from 'react-icons/md';
import { FilterSidebar } from "./filters/FilterSidebar";
import { motion, AnimatePresence } from 'framer-motion';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'new', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'match', label: 'Best Match' }
];

export default function DashboardFilters() {
  const { filters, updateFilters, activeFilterCount } = useFilters();
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  return (
    <div className="flex items-center justify-between relative" ref={dropdownRef}>
      {/* Advanced Filters Button */}
      <button 
        onClick={() => setShowFilters(!showFilters)}
        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-heading font-medium transition-all ${
          showFilters || activeFilterCount > 0
            ? 'bg-navy-950 text-white border-navy-950 shadow-md shadow-navy-950/20' 
            : 'bg-white text-navy-700 border-navy-200 hover:border-navy-300 hover:bg-navy-50 shadow-sm'
        }`}
      >
        <MdTune size={18} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-terracotta-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold absolute -top-1.5 -right-1.5 shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sort By */}
      <div className="flex items-center gap-2 bg-white border border-navy-200 rounded-xl px-3 py-2 shadow-sm">
        <MdSort size={18} className="text-navy-500" />
        <label htmlFor="sort-by" className="text-xs font-heading font-bold text-navy-600 uppercase tracking-wide">
          Sort by
        </label>
        <select
          id="sort-by"
          value={filters.sortBy || 'recommended'}
          onChange={(e) => updateFilters({ sortBy: e.target.value })}
          className="bg-transparent text-sm font-heading font-medium text-navy-900 outline-none pr-1"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Filters Dropdown (Desktop Panel) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 w-[400px] h-[calc(100vh-180px)] max-h-[700px] z-[9999] bg-white rounded-3xl shadow-2xl border border-navy-200 overflow-hidden"
          >
             {/* The exact internal FilterSidebar has a flex column that handles its own header and scrolling! */}
             <div className="h-full relative filter-sidebar-container bg-white">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="absolute top-5 right-5 z-[100] p-1.5 bg-navy-50 hover:bg-navy-100 rounded-full text-navy-600 transition-colors"
                >
                  <MdClose size={20} />
                </button>
                <FilterSidebar />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
