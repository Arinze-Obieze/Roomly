'use client';

const OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'immediately', label: 'Immediately' },
  { value: 'this_month', label: 'This month' },
  { value: 'next_month', label: 'Next month' },
  { value: 'flexible', label: 'Flexible' },
];

export default function MoveInDateFilter({ value = 'any', onChange }) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border ${
            value === opt.value
              ? 'bg-terracotta-50 border-terracotta-400 text-terracotta-700'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <input
            type="radio"
            name="moveInDate"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
            value === opt.value ? 'border-terracotta-500' : 'border-slate-300'
          }`}>
            {value === opt.value && (
              <span className="w-2 h-2 rounded-full bg-terracotta-500" />
            )}
          </span>
          <span className="text-sm font-medium">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
