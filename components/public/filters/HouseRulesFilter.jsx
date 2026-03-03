'use client';

import { MdSmokeFree, MdPets, MdFavorite, MdSchool } from 'react-icons/md';

const OPTIONS = [
  { value: 'no_smoking', label: 'No Smokers', icon: MdSmokeFree },
  { value: 'pets_allowed', label: 'Pets Allowed', icon: MdPets },
  { value: 'couples_welcome', label: 'Couples Welcome', icon: MdFavorite },
  { value: 'students_welcome', label: 'Students Welcome', icon: MdSchool },
];

export default function HouseRulesFilter({ values = [], onChange }) {
  const toggle = (val) => {
    const next = values.includes(val)
      ? values.filter((v) => v !== val)
      : [...values, val];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = values.includes(value);
        return (
          <label
            key={value}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
              active
                ? 'bg-terracotta-50 border-terracotta-400'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(value)}
              className="sr-only"
            />
            <Icon
              size={18}
              className={active ? 'text-terracotta-500' : 'text-slate-400'}
            />
            <span className={`text-sm font-medium flex-1 ${active ? 'text-terracotta-700' : 'text-slate-700'}`}>
              {label}
            </span>
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              active ? 'bg-terracotta-500 border-terracotta-500' : 'border-slate-300'
            }`}>
              {active && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
