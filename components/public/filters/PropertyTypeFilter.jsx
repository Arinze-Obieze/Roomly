'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { MdCheck, MdOutlineClose } from 'react-icons/md';
import { PROPERTY_CATEGORIES } from '@/data/listingOptions';

export default function PropertyTypeFilter({ values = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState(values);
  const containerRef = useRef(null);
  const committedValuesRef = useRef(values);
  const OPTIONS = PROPERTY_CATEGORIES.map((category) => ({
    id: category.value,
    label: category.label,
  }));
  const valuesKey = useMemo(() => values.join('|'), [values]);

  useEffect(() => {
    committedValuesRef.current = values;
    setDraftValues(values);
  }, [valuesKey, values]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDraftValues(committedValuesRef.current);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id) => {
      if (id === 'any') {
          setDraftValues([]);
          return;
      }
      
      const newValues = draftValues.includes(id) 
        ? draftValues.filter(v => v !== id)
        : [...draftValues, id];

      setDraftValues(newValues);
  };

  const getLabel = () => {
     if (!values || values.length === 0) return 'Any type';
     if (values.length === 1) {
         const opt = OPTIONS.find(o => o.id === values[0]);
         return opt ? opt.label : 'Any type';
     }
     return `${values.length} Types`;
  };

  const isActive = values && values.length > 0;

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
        <div className="absolute top-full left-0 mt-4 w-[280px] bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-[99999] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-bold text-lg text-slate-900">Property Type</h3>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
               <MdOutlineClose size={20} />
            </button>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
             <button
               onClick={() => handleSelect('any')}
               className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                  !draftValues || draftValues.length === 0 ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
               }`}
             >
                Any Type
                {(!draftValues || draftValues.length === 0) && <MdCheck className="text-terracotta-600" />}
             </button>
             {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                     draftValues.includes(opt.id) ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                   {opt.label}
                   {draftValues.includes(opt.id) && <MdCheck className="text-cyan-600" />}
                </button>
             ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setDraftValues([]);
                onChange([]);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(draftValues);
                setIsOpen(false);
              }}
              className="px-5 py-2.5 rounded-full bg-terracotta-500 text-white text-sm font-semibold hover:bg-terracotta-600 transition-colors shadow-lg shadow-terracotta-500/20"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
