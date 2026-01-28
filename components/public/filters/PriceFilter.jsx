'use client';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useState, useRef, useEffect } from 'react';
import { MdEuro, MdOutlineClose } from 'react-icons/md';

export default function PriceFilter({ minPrice, maxPrice, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState([minPrice || 0, maxPrice || 5000]);
  const containerRef = useRef(null);

  const MIN = 0;
  const MAX = 5000;

  useEffect(() => {
    setRange([minPrice || 0, maxPrice || 5000]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSliderChange = (newRange) => {
    setRange(newRange);
  };

  const handleInputChange = (index, value) => {
    const newRange = [...range];
    newRange[index] = Number(value);
    setRange(newRange);
  };

  const applyFilter = () => {
    onChange(range[0], range[1]);
    setIsOpen(false);
  };

  const clearFilter = () => {
    setRange([MIN, MAX]);
    onChange(MIN, MAX);
    // Keep open to show reset state or close? Let's leave open for adjustment.
  };

  const isActive = (minPrice && minPrice > MIN) || (maxPrice && maxPrice < MAX);

  return (
    <div ref={containerRef} className="relative group">
       <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-100 transition-colors text-left min-w-[140px] ${isOpen ? 'bg-slate-100 shadow-sm' : ''}`}
      >
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-800 cursor-pointer">Price</label>
          <span className="block text-sm text-slate-600 truncate">
             {isActive ? `€${range[0]} - €${range[1]}+` : 'Add price'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-4 w-[340px] bg-white rounded-3xl shadow-xl border border-slate-100 p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900">Price Range</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
               <MdOutlineClose size={20} />
            </button>
          </div>

          {/* Inputs */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
               <div className="absolute top-2 left-3 text-[10px] font-bold text-slate-500">Min</div>
               <input 
                 type="number" 
                 value={range[0]}
                 min={MIN}
                 max={range[1]}
                 onChange={(e) => handleInputChange(0, e.target.value)}
                 className="w-full pt-6 pb-2 pl-7 pr-3 border border-slate-300 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-bold text-slate-900"
               />
            </div>
            <div className="flex items-center text-slate-400">-</div>
            <div className="flex-1 relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
               <div className="absolute top-2 left-3 text-[10px] font-bold text-slate-500">Max</div>
               <input 
                 type="number" 
                 value={range[1]}
                 min={range[0]}
                 max={MAX}
                 onChange={(e) => handleInputChange(1, e.target.value)}
                 className="w-full pt-6 pb-2 pl-7 pr-3 border border-slate-300 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-bold text-slate-900"
               />
            </div>
          </div>

          {/* Slider */}
          <div className="px-2 mb-8">
            <Slider
              range
              min={MIN}
              max={MAX}
              value={range}
              onChange={handleSliderChange}
              step={50}
              railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
              trackStyle={[{ backgroundColor: '#0891b2', height: 4 }]}
              handleStyle={[
                { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 24, width: 24, marginTop: -10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 24, width: 24, marginTop: -10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
              ]}
            />
             <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                <span>€{MIN}</span>
                <span>€{MAX}+</span>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
             <button 
               onClick={clearFilter}
               className="text-sm font-semibold text-slate-500 hover:text-slate-800 underline"
             >
               Reset
             </button>
             <button 
               onClick={applyFilter}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
             >
               Apply Filter
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
