"use client";

import { MdArrowBack } from "react-icons/md";
import { useFilters } from "./useFilters";
import { FilterContent } from "../ui/FilterContent";

export const FilterModal = ({ isOpen, onClose }) => {
  const { resetFilters } = useFilters();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white lg:hidden">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <MdArrowBack size={24} />
          </button>
          <h2 className="text-lg font-bold">Filters</h2>
          <button 
            onClick={resetFilters}
            className="text-cyan-600 font-semibold text-sm"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <FilterContent variant="modal" />
        </div>

        <div className="border-t border-slate-200 p-4">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl"
          >
            Apply Filters • 12 Properties
          </button>
        </div>
      </div>
    </div>
  );
};