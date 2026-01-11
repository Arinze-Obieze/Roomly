"use client";

import { 
  MdFavoriteBorder, 
  MdChevronRight,
  MdAccessTime
} from "react-icons/md";
import { FilterSidebarContent } from "../filters/FilterSidebarContent";
import { useFilters } from "../filters/useFilters";

export const LeftSidebar = () => {
  const { savedSearches, applySavedSearch } = useFilters();

  return (
    <aside className="hidden xl:block fixed left-0 top-[120px] w-72 h-[calc(100vh-120px)] bg-white border-r border-slate-200 overflow-y-auto">
      {/* Saved Searches */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-3">SAVED SEARCHES</h3>
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <button
              key={search.id}
              onClick={() => applySavedSearch(search.filters)}
              className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 rounded-lg group"
            >
              <div className="flex items-center gap-2">
                <MdFavoriteBorder className="text-rose-400" size={16} />
                <span className="text-sm text-slate-700">{search.name}</span>
              </div>
              <MdChevronRight className="text-slate-400 group-hover:text-slate-600" size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-sm mb-3">FILTERS</h3>
          <FilterSidebarContent />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 border-t border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm mb-3">RECENT</h3>
        <div className="space-y-2">
          {['Ranelagh', 'Drumcondra', 'Belfield'].map((area, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-2 p-2 text-left hover:bg-slate-50 rounded-lg"
            >
              <MdAccessTime className="text-slate-400" size={16} />
              <span className="text-sm text-slate-600">{area}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};