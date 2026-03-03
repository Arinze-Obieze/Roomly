'use client';

const OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'ensuite', label: 'Master / Ensuite' },
];

export default function RoomTypeFilter({ value = 'any', onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            value === opt.value
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
