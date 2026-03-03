'use client';

import { MdElectricBolt } from 'react-icons/md';

export default function BillsIncludedFilter({ value = false, onChange }) {
  return (
    <label className={`flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer transition-all border-2 ${
      value
        ? 'bg-terracotta-50 border-terracotta-400'
        : 'border-slate-200 hover:border-slate-300 bg-white'
    }`}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        value ? 'bg-terracotta-500' : 'bg-slate-100'
      }`}>
        <MdElectricBolt size={20} className={value ? 'text-white' : 'text-slate-400'} />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${value ? 'text-terracotta-800' : 'text-slate-800'}`}>
          Bills included in rent
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Electricity, gas & internet covered
        </p>
      </div>
      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        value ? 'bg-terracotta-500 border-terracotta-500' : 'border-slate-300'
      }`}>
        {value && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" />
          </svg>
        )}
      </div>
    </label>
  );
}
