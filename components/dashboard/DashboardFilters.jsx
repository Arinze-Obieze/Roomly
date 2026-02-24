'use client';

import { useFilters } from "./filters/useFilters";
import { MdSort } from 'react-icons/md';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'new', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'match', label: 'Best Match' }
];

export default function DashboardFilters() {
  const { filters, updateFilters } = useFilters();

  return (
    <div className="flex items-center justify-end">
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
    </div>
  );
}
