'use client';

import { MdClose } from 'react-icons/md';
import { DEFAULT_FILTERS } from '@/core/contexts/FilterContext';

const MOVE_IN_LABELS = {
  immediately: 'Immediately',
  this_month: 'This month',
  next_month: 'Next month',
  flexible: 'Flexible',
};

const ROOM_TYPE_LABELS = {
  single: 'Single',
  double: 'Double',
  ensuite: 'Ensuite',
};

const HOUSE_RULE_LABELS = {
  no_smoking: 'No Smokers',
  pets_allowed: 'Pets OK',
  couples_welcome: 'Couples OK',
  students_welcome: 'Students OK',
};

const AMENITY_LABELS = {
  wifi: 'WiFi',
  furnished: 'Furnished',
  ensuite: 'Ensuite Bath',
  parking: 'Parking',
  washing_machine: 'Washing Machine',
  garden: 'Garden',
  central_heating: 'Heating',
  dishwasher: 'Dishwasher',
};

function Pill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-full whitespace-nowrap">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <MdClose size={12} />
      </button>
    </span>
  );
}

export default function FilterPills({ filters, onFilterChange, onReset }) {
  const pills = [];

  if (filters.location) {
    pills.push({
      key: 'location',
      label: `📍 ${filters.location}`,
      remove: () => onFilterChange('location', ''),
    });
  }

  if ((filters.minPrice && filters.minPrice > 0) || (filters.maxPrice && filters.maxPrice < 5000)) {
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? 5000;
    pills.push({
      key: 'price',
      label: `€${min} – €${max}`,
      remove: () => {
        onFilterChange('minPrice', null);
        onFilterChange('maxPrice', null);
      },
    });
  }

  if (filters.moveInDate && filters.moveInDate !== 'any') {
    pills.push({
      key: 'moveInDate',
      label: `📅 ${MOVE_IN_LABELS[filters.moveInDate] || filters.moveInDate}`,
      remove: () => onFilterChange('moveInDate', 'any'),
    });
  }

  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    filters.propertyTypes.forEach((pt) => {
      pills.push({
        key: `pt-${pt}`,
        label: pt.charAt(0).toUpperCase() + pt.slice(1),
        remove: () =>
          onFilterChange(
            'propertyTypes',
            filters.propertyTypes.filter((p) => p !== pt)
          ),
      });
    });
  }

  if (filters.roomType && filters.roomType !== 'any') {
    pills.push({
      key: 'roomType',
      label: `🛏 ${ROOM_TYPE_LABELS[filters.roomType] || filters.roomType}`,
      remove: () => onFilterChange('roomType', 'any'),
    });
  }

  if (filters.minBedrooms && filters.minBedrooms > 0) {
    pills.push({
      key: 'beds',
      label: `${filters.minBedrooms}+ Beds`,
      remove: () => onFilterChange('minBedrooms', 0),
    });
  }

  if (filters.minBathrooms && filters.minBathrooms > 0) {
    pills.push({
      key: 'baths',
      label: `${filters.minBathrooms}+ Baths`,
      remove: () => onFilterChange('minBathrooms', 0),
    });
  }

  if (filters.minCompatibility && filters.minCompatibility > 60) {
    pills.push({
      key: 'compat',
      label: `✨ ${filters.minCompatibility}%+ match`,
      remove: () => onFilterChange('minCompatibility', 60),
    });
  }

  if (filters.houseRules && filters.houseRules.length > 0) {
    filters.houseRules.forEach((rule) => {
      pills.push({
        key: `rule-${rule}`,
        label: HOUSE_RULE_LABELS[rule] || rule,
        remove: () =>
          onFilterChange(
            'houseRules',
            filters.houseRules.filter((r) => r !== rule)
          ),
      });
    });
  }

  if (filters.amenities && filters.amenities.length > 0) {
    filters.amenities.forEach((a) => {
      pills.push({
        key: `am-${a}`,
        label: AMENITY_LABELS[a] || a,
        remove: () =>
          onFilterChange(
            'amenities',
            filters.amenities.filter((x) => x !== a)
          ),
      });
    });
  }

  if (filters.billsIncluded) {
    pills.push({
      key: 'bills',
      label: '⚡ Bills included',
      remove: () => onFilterChange('billsIncluded', false),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-4 md:px-6">
      {pills.map(({ key, label, remove }) => (
        <Pill key={key} label={label} onRemove={remove} />
      ))}
      {pills.length > 1 && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
