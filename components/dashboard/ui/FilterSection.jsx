"use client";

import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useState } from "react";

export const FilterSection = ({ title, children, isSidebar, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={isSidebar ? "mb-4" : "mb-6 pb-6 border-b border-navy-100 last:border-0"}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full ${isSidebar ? "mb-2" : "mb-4"}`}
      >
        <h3 className={`font-semibold ${isSidebar ? "text-slate-900 text-sm" : "text-navy-950 text-base"}`}>
          {title}
        </h3>
        {isOpen ? 
          <MdExpandLess size={isSidebar ? 18 : 24} className={isSidebar ? "text-slate-400" : "text-navy-400"} /> : 
          <MdExpandMore size={isSidebar ? 18 : 24} className={isSidebar ? "text-slate-400" : "text-navy-400"} />
        }
      </button>
      
      {/* Use layout animation or standard render */}
      {isOpen && (
        <div className={`transition-all ${isSidebar ? "mb-2" : ""}`}>
          {children}
        </div>
      )}
    </div>
  );
};