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
    <div className="fixed inset-0 flex items-center justify-center p-0 md:p-6 lg:p-8 bg-navy-900/60 backdrop-blur-sm" style={{ zIndex: 99999 }}>
      <div className="w-full md:max-w-3xl bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full md:max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-navy-200 bg-white/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-navy-50 transition-colors"
            >
              <MdArrowBack size={24} className="text-navy-700" />
            </button>
            <h2 className="text-lg font-heading font-bold text-navy-950">Filters</h2>
          </div>
          <button 
            onClick={resetFilters}
            className="text-terracotta-600 font-heading font-bold text-sm px-4 py-2 hover:bg-terracotta-50 rounded-lg transition-colors"
          >
            Reset all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar bg-navy-50/30">
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
