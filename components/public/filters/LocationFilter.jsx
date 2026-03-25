'use client';

import { MdLocationOn, MdClose } from 'react-icons/md';
import { useState, useRef, useEffect, useMemo } from 'react';
import { CITIES_TOWNS } from '@/data/locations';

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

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return CITIES_TOWNS.slice(0, 8);

    return CITIES_TOWNS
      .filter((city) => city.toLowerCase().includes(query))
      .slice(0, 8);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    setIsOpen(true);
    onChange(newVal); 
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setIsOpen(false);
  };

  const handleSelectSuggestion = (city) => {
    setInputValue(city);
    onChange(city);
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
            onFocus={() => setIsOpen(true)}
            placeholder="Search city"
            className="w-full bg-transparent border-none p-0 text-sm text-slate-600 placeholder:text-slate-400 focus:ring-0 focus:outline-none truncate cursor-text"
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

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-full min-w-[260px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl z-[99999]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Suggested cities
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto py-2">
            {suggestions.length > 0 ? (
              suggestions.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelectSuggestion(city)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <MdLocationOn className="shrink-0 text-slate-300" />
                  <span>{city}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-slate-500">
                No matching cities. Keep typing to search freely.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
