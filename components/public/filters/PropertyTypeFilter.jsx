'use client';

import { useState, useRef, useEffect } from 'react';
import { MdHomeWork, MdCheck, MdOutlineClose } from 'react-icons/md';

export default function PropertyTypeFilter({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const OPTIONS = [
     { id: 'room', label: 'Private Room' },
     { id: 'studio', label: 'Studio' },
     { id: 'apartment', label: 'Apartment' },
     { id: 'house', label: 'House' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id) => {
      // Toggle logic if we want multi-select, but let's stick to single select for now as per previous implementation 
      // OR switch to multi-select? Proposal said "Dropdown with simple checkboxes or pill selection".
      // Let's allow multi-select for better UX? "Apartment OR House" is common. 
      // BUT backend implementation might need adjustment. Previous was 'any' or single string.
      // Let's stick to single select + 'any' for now to match current backend capabilities safely, 
      // or implement multi specific logic.
      // Let's stick to single select based on "Private Room, Studio, Apartment, House" proposal.
      
      const newVal = value === id ? 'any' : id;
      onChange(newVal);
      setIsOpen(false);
  };

  const getLabel = () => {
     if (!value || value === 'any') return 'Any type';
     const opt = OPTIONS.find(o => o.id === value);
     return opt ? opt.label : 'Any type';
  };

  const isActive = value && value !== 'any';

  return (
    <div ref={containerRef} className="relative group">
       <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-100 transition-colors text-left min-w-[140px] ${isOpen ? 'bg-slate-100 shadow-sm' : ''}`}
      >
        <div className="flex-1">
           <label className="block text-xs font-bold text-slate-800 cursor-pointer">Property Type</label>
           <span className="block text-sm text-slate-600 truncate">{getLabel()}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-4 w-[280px] bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-lg text-slate-900">Property Type</h3>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
               <MdOutlineClose size={20} />
            </button>
          </div>

          <div className="space-y-1">
             <button
               onClick={() => handleSelect('any')}
               className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                  !value || value === 'any' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
                Any Type
                {(!value || value === 'any') && <MdCheck className="text-cyan-600" />}
             </button>
             {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                     value === opt.id ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                   {opt.label}
                   {value === opt.id && <MdCheck className="text-cyan-600" />}
                </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
