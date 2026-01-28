'use client';

import { useState, useRef, useEffect } from 'react';
import { MdOutlineBed, MdOutlineBathtub, MdOutlineClose } from 'react-icons/md';

export default function BedsBathsFilter({ beds, baths, onChange }) {
  // beds and baths here refer to minBedrooms and minBathrooms 
  // passed from parent (which maps filters.minBedrooms -> beds)
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBedsChange = (val) => {
    // Send 0 or null for 'any', or the number
    // Parent expects 'minBedrooms' key update if we change the key passed
    // But FilterBar passes onChange('bedrooms', val) -> which maps to updateFilters({bedrooms: val})
    // We need to change FilterBar to map to minBedrooms.
    // For now, let's assume parent handles key mapping OR we change parent.
    // Let's assume this component just emits value.
    onChange('minBedrooms', val === 'any' ? 0 : val);
  };
  
  const handleBathsChange = (val) => {
     onChange('minBathrooms', val === 'any' ? 0 : val);
  };

  const getLabel = () => {
    let parts = [];
    if (beds && beds > 0) parts.push(`${beds}+ Beds`);
    if (baths && baths > 0) parts.push(`${baths}+ Baths`);
    return parts.length > 0 ? parts.join(', ') : 'Add beds & baths';
  };

  const isActive = (beds && beds > 0) || (baths && baths > 0);

  return (
    <div ref={containerRef} className="relative group">
       <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-100 transition-colors text-left min-w-[140px] ${isOpen ? 'bg-slate-100 shadow-sm' : ''}`}
      >
        <div className="flex-1">
           <label className="block text-xs font-bold text-slate-800 cursor-pointer">Beds & Baths</label>
           <span className="block text-sm text-slate-600 truncate">{getLabel()}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-4 w-[340px] bg-white rounded-3xl shadow-xl border border-slate-100 p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-900">Beds & Baths</h3>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
               <MdOutlineClose size={20} />
            </button>
          </div>

          {/* Beds Section */}
          <div className="mb-6">
             <label className="block text-sm font-semibold text-slate-700 mb-3">Bedrooms</label>
             <div className="flex gap-2">
                <button
                   onClick={() => handleBedsChange('any')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      !beds || beds === 0
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                   }`}
                >
                   Any
                </button>
                {[1, 2, 3, 4, 5].map(num => (
                   <button
                     key={num}
                     onClick={() => handleBedsChange(num)}
                     className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        beds === num
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                     }`}
                   >
                      {num}{num === 5 ? '+' : ''}
                   </button>
                ))}
             </div>
          </div>

          {/* Baths Section */}
          <div className="mb-6">
             <label className="block text-sm font-semibold text-slate-700 mb-3">Bathrooms</label>
             <div className="flex gap-2">
                <button
                   onClick={() => handleBathsChange('any')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      !baths || baths === 0
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                   }`}
                >
                   Any
                </button>
                {[1, 2, 3, 4].map(num => (
                   <button
                     key={num}
                     onClick={() => handleBathsChange(num)}
                     className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        baths === num
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                     }`}
                   >
                      {num}{num === 4 ? '+' : ''}
                   </button>
                ))}
             </div>
          </div>
          
           {/* Footer */}
           <div className="flex justify-end pt-4 border-t border-slate-100">
             <button 
               onClick={() => setIsOpen(false)}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
             >
               Apply
             </button>
          </div>

        </div>
      )}
    </div>
  );
}
