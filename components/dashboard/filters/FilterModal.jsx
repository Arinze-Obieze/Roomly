"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdArrowBack } from "react-icons/md";
import { useFilters } from "./useFilters";
import { FilterContent } from "../ui/FilterContent";

export const FilterModal = ({ isOpen, onClose, resultsCount = 0, isLoading = false }) => {
  const { resetFilters } = useFilters();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-navy-50 lg:hidden">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-navy-200 bg-white/95 backdrop-blur-md">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-50"
          >
            <MdArrowBack size={24} className="text-navy-700" />
          </button>
          <h2 className="text-lg font-heading font-bold text-navy-950">Filters</h2>
          <button 
            onClick={resetFilters}
            className="text-terracotta-600 font-heading font-bold text-sm"
          >
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <FilterContent variant="modal" />
        </div>

        <div className="border-t border-navy-200 p-4 bg-white">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-heading font-bold rounded-xl shadow-lg shadow-terracotta-500/20 transition-colors"
          >
            {isLoading
              ? 'Applying filters...'
              : `Apply Filters • ${resultsCount} ${resultsCount === 1 ? 'Property' : 'Properties'}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
