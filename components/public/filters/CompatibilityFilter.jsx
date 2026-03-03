'use client';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { MdAutoAwesome } from 'react-icons/md';

const LABELS = {
  60: 'Any match',
  70: 'Good',
  80: 'Strong',
  90: 'Excellent',
  100: 'Perfect only',
};

export default function CompatibilityFilter({ value = 60, onChange }) {
  const label = LABELS[Math.round(value / 10) * 10] || `${value}%+`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MdAutoAwesome className="text-terracotta-500" size={18} />
          <span className="text-sm font-semibold text-slate-700">
            Show <span className="text-terracotta-600 font-bold">{value}%+</span> matches
          </span>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-terracotta-50 text-terracotta-600 rounded-full">
          {label}
        </span>
      </div>

      <div className="px-1">
        <Slider
          min={60}
          max={100}
          value={value}
          step={5}
          onChange={onChange}
          railStyle={{ backgroundColor: '#e2e8f0', height: 6 }}
          trackStyle={{ backgroundColor: '#e96b4a', height: 6 }}
          handleStyle={{
            borderColor: '#e96b4a',
            backgroundColor: 'white',
            opacity: 1,
            height: 24,
            width: 24,
            marginTop: -9,
            boxShadow: '0 2px 8px rgba(233,107,74,0.35)',
          }}
        />
        <div className="flex justify-between mt-2 text-[11px] text-slate-400 font-medium">
          <span>60%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>

      {value > 60 && (
        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          Only properties with a {value}%+ compatibility score will be shown. 
          Fewer results, but better fit.
        </p>
      )}
    </div>
  );
}
