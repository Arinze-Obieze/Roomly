"use client";

import { FilterContent } from "../ui/FilterContent";
import { useFilters } from "./useFilters";
import { motion } from "framer-motion";

export const FilterSidebar = () => {
  const { resetFilters, activeFilterCount } = useFilters();

  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-2rem)] shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-navy-100">
        <div className="flex items-center gap-2">
          <h2 className="font-heading font-bold text-navy-950">Filters</h2>
          {activeFilterCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-terracotta-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
            >
              {activeFilterCount}
            </motion.span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button 
            onClick={resetFilters}
            className="text-terracotta-500 hover:text-terracotta-600 text-xs font-heading font-bold transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar p-5 pb-10">
        <FilterContent variant="sidebar" />
      </div>
    </div>
  );
};