'use client';

import { useFilters } from "./filters/useFilters";
import { MdSort, MdTune, MdKeyboardArrowDown } from 'react-icons/md';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'new', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'match', label: 'Best Match' }
];

export default function DashboardFilters({ onOpenFilters }) {
  const { filters, updateFilters, activeFilterCount } = useFilters();

  return (
    <div className="flex items-center justify-between relative w-full pb-2">
      {/* Advanced Filters Button (Desktop Only) */}
      <button 
        onClick={onOpenFilters}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl border bg-white text-navy-700 border-navy-200 hover:border-navy-300 hover:bg-navy-50 shadow-sm text-sm font-heading font-bold transition-all"
      >
        <MdTune size={18} />
        <span>Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-terracotta-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold absolute -top-1.5 -right-1.5 shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sort By Dropdown Wrapper */}
      <div className="relative group cursor-pointer flex items-center gap-2 bg-white border border-navy-200 rounded-xl px-4 py-2 hover:border-navy-300 shadow-sm hover:shadow transition-all">
        <MdSort size={18} className="text-navy-500" />
        <label htmlFor="sort-by" className="text-xs font-heading font-bold text-navy-500 uppercase tracking-wide cursor-pointer hidden sm:block">
          Sort by:
        </label>
        <div className="relative flex items-center">
          <select
            id="sort-by"
            value={filters.sortBy || 'recommended'}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="appearance-none bg-transparent text-sm font-heading font-bold text-navy-950 outline-none pr-6 cursor-pointer w-full"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <MdKeyboardArrowDown size={16} className="text-navy-500 absolute right-0 pointer-events-none group-hover:text-navy-900 transition-colors" />
        </div>
      </div>
    </div>
  );
}
