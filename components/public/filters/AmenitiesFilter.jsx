'use client';

import {
  MdWifi, MdChair, MdBathtub, MdDirectionsCar,
  MdLocalLaundryService, MdYard, MdThermostat, MdKitchen
} from 'react-icons/md';

const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'WiFi', icon: MdWifi },
  { id: 'furnished', label: 'Furnished', icon: MdChair },
  { id: 'ensuite', label: 'Ensuite', icon: MdBathtub },
  { id: 'parking', label: 'Parking', icon: MdDirectionsCar },
  { id: 'washing_machine', label: 'Washing Machine', icon: MdLocalLaundryService },
  { id: 'garden', label: 'Garden / Outdoor', icon: MdYard },
  { id: 'central_heating', label: 'Central Heating', icon: MdThermostat },
  { id: 'dishwasher', label: 'Dishwasher', icon: MdKitchen },
];

export default function AmenitiesFilter({ values = [], onChange }) {
  const toggle = (id) => {
    const next = values.includes(id)
      ? values.filter((v) => v !== id)
      : [...values, id];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {AMENITY_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = values.includes(id);
        return (
          <label
            key={id}
            className={`flex items-center gap-2.5 px-3 py-3 rounded-xl cursor-pointer transition-all border ${
              active
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(id)}
              className="sr-only"
            />
            <Icon size={16} className={active ? 'text-white' : 'text-slate-400'} />
            <span className="text-sm font-medium leading-tight">{label}</span>
          </label>
        );
      })}
    </div>
  );
}
