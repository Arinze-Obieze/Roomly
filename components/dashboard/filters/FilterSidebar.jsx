"use client";

import { FilterContent } from "../ui/FilterContent";
import { useFilters } from "./useFilters";

export const FilterSidebar = () => {
  const { resetFilters, activeFilterCount } = useFilters();

  return (
    <div className="hidden lg:flex flex-col w-80 h-[calc(100vh-80px)] fixed left-0 top-20 bg-white border-r border-slate-200 overflow-hidden z-20">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-900">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button 
            onClick={resetFilters}
            className="text-cyan-600 hover:text-cyan-700 text-sm font-semibold transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        <FilterContent variant="sidebar" />
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-center text-slate-500">
          Showing results for Ireland
        </p>
      </div>
    </div>
  );
};
