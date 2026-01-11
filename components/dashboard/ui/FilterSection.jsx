"use client";

import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useState } from "react";

export const FilterSection = ({ title, children, isSidebar, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isSidebar) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full mb-2"
        >
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          {isOpen ? 
            <MdExpandLess size={18} className="text-slate-400" /> : 
            <MdExpandMore size={18} className="text-slate-400" />
          }
        </button>
        {isOpen && <div className="mb-2">{children}</div>}
      </div>
    );
  }

  // Mobile/Modal variant - always open
  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
};