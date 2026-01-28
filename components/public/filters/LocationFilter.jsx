'use client';

import { MdLocationOn, MdClose } from 'react-icons/md';
import { useState, useRef, useEffect } from 'react';

export default function LocationFilter({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    onChange(newVal); 
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative group w-full md:w-auto md:min-w-[200px]">
      <div 
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-100 cursor-pointer transition-colors ${isOpen ? 'bg-slate-100 shadow-sm' : ''}`}
      >
        <MdLocationOn className="text-xl text-slate-400 group-hover:text-slate-600 transition-colors" />
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-800 cursor-pointer">Location</label>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Where are you going?"
            className="w-full bg-transparent border-none p-0 text-sm text-slate-600 placeholder:text-slate-400 focus:ring-0 focus:outline-none truncate cursor-pointer"
          />
        </div>
        {inputValue && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearInput();
            }}
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
          >
            <MdClose size={16} />
          </button>
        )}
      </div>

      {/* Suggested Locations Dropdown (Optional Enhancement) */}
      {/* 
        This could be populated with popular locations or recent searches.
        For now, we'll keep it simple as just an input wrapper.
      */}
    </div>
  );
}
