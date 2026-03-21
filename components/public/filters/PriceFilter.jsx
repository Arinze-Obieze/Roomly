'use client';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useState, useRef, useEffect } from 'react';
import { MdEuro, MdOutlineClose } from 'react-icons/md';

export default function PriceFilter({ minPrice, maxPrice, onChange, inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const MIN = 0;
  const MAX = 5000;

  const [range, setRange] = useState([minPrice || 0, maxPrice || 5000]);
  
  // Format utility
  const formatNumber = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = val.toString().replace(/\D/g, ''); // strip non-digits
    if (!num || num === '0') return '';
    return Number(num).toLocaleString('en-US');
  };

  // Local state for the inputs (Strict >0 to ensure '0' string doesn't slip through)
  const [minStr, setMinStr] = useState(minPrice && Number(minPrice) > 0 ? formatNumber(minPrice) : '');
  const [maxStr, setMaxStr] = useState(maxPrice && Number(maxPrice) > 0 ? formatNumber(maxPrice) : '5,000');
  
  const containerRef = useRef(null);

  // Sync with parent props
  useEffect(() => {
    setRange([minPrice || 0, maxPrice || 5000]);
    setMinStr(minPrice && Number(minPrice) > 0 ? formatNumber(minPrice) : '');
    setMaxStr(maxPrice && Number(maxPrice) > 0 ? formatNumber(maxPrice) : '5,000');
  }, [minPrice, maxPrice]);

  // Click outside to close (dropdown mode)
  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  // Handle slider movement (updates EVERYTHING at once, safely)
  const handleSliderChange = (newRange) => {
    setRange(newRange);
    setMinStr(newRange[0] === 0 ? '' : formatNumber(newRange[0]));
    setMaxStr(newRange[1] === 0 ? '' : formatNumber(newRange[1]));
  };

  // Handle raw typing — aggressively strip leading zeros!
  const handleMinChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '');
    }
    setMinStr(raw); 
  };

  const handleMaxChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '');
    }
    setMaxStr(raw);
  };

  // Blur / Apply — format visually, update slider, notify parent
  const applyFilter = () => {
    let finalMin = minStr ? Number(minStr.replace(/,/g, '')) : 0;
    let finalMax = maxStr ? Number(maxStr.replace(/,/g, '')) : 5000;

    // Sanity checks
    if (finalMin > finalMax) finalMin = finalMax;
    if (finalMin < MIN) finalMin = MIN;
    if (finalMax > MAX) finalMax = MAX;

    // Update local UI
    setMinStr(finalMin === 0 ? '' : formatNumber(finalMin));
    setMaxStr(finalMax === 0 ? '' : formatNumber(finalMax));
    setRange([finalMin, finalMax]);

    // Send to parent
    onChange(finalMin, finalMax);
  };

  const applyAndClose = () => {
    applyFilter();
    if (!inline) setIsOpen(false);
  };

  const clearFilter = () => {
    setRange([MIN, MAX]);
    setMinStr('');
    setMaxStr('5,000');
    onChange(MIN, MAX);
  };

  const isActive = (minPrice && minPrice > MIN) || (maxPrice && maxPrice < MAX);

  const FilterContent = () => (
    <div className={inline ? "w-full" : "absolute top-full left-0 mt-4 w-[340px] bg-white rounded-3xl shadow-xl border border-slate-100 p-6 z-[99999] animate-in fade-in zoom-in-95 duration-200"}>
      {!inline && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900">Price Range</h3>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
             <MdOutlineClose size={20} />
          </button>
        </div>
      )}

      {/* Inputs */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
           <div className="absolute top-2 left-3 text-[10px] font-bold text-slate-500">Min</div>
           <input 
             type="text" 
             inputMode="numeric"
             placeholder=""
             value={minStr}
             onChange={handleMinChange}
             onBlur={applyFilter}
             className="w-full pt-6 pb-2 pl-7 pr-3 border border-slate-300 rounded-xl focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 outline-none font-bold text-slate-900"
           />
        </div>
        <div className="flex items-center text-slate-400">-</div>
        <div className="flex-1 relative">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
           <div className="absolute top-2 left-3 text-[10px] font-bold text-slate-500">Max</div>
           <input 
             type="text" 
             inputMode="numeric"
             placeholder=""
             value={maxStr}
             onChange={handleMaxChange}
             onBlur={applyFilter}
             className="w-full pt-6 pb-2 pl-7 pr-3 border border-slate-300 rounded-xl focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 outline-none font-bold text-slate-900"
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
          onAfterChange={applyFilter}
          step={50}
          railStyle={{ backgroundColor: '#e2e8f0', height: 4 }}
          trackStyle={[{ backgroundColor: '#0891b2', height: 4 }]}
          handleStyle={[
            { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 24, width: 24, marginTop: -10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
            { borderColor: '#0891b2', backgroundColor: 'white', opacity: 1, height: 24, width: 24, marginTop: -10, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
          ]}
        />
         <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
            <span>€{MIN.toLocaleString('en-US')}</span>
            <span>€{MAX.toLocaleString('en-US')}+</span>
         </div>
      </div>

      {/* Footer Actions */}
      {!inline && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
             <button 
               onClick={clearFilter}
               className="text-sm font-semibold text-slate-500 hover:text-slate-800 underline"
             >
               Reset
             </button>
             <button 
               onClick={applyAndClose}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
             >
               Apply Filter
             </button>
          </div>
      )}
    </div>
  );

  if (inline) {
    return <FilterContent />;
  }

  return (
    <div ref={containerRef} className="relative group">
       <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-100 transition-colors text-left min-w-[140px] ${isOpen ? 'bg-slate-100 shadow-sm' : ''}`}
      >
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-800 cursor-pointer">Price</label>
          <span className="block text-sm text-slate-600 truncate">
             {isActive ? `€${(minPrice||0).toLocaleString('en-US')} - €${(maxPrice||5000).toLocaleString('en-US')}+` : 'Add price'}
          </span>
        </div>
      </button>

      {isOpen && <FilterContent />}
    </div>
  );
}
