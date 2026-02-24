'use client';

import { MdOutlineBed, MdBathtub, MdSquareFoot, MdCalendarToday, MdHomeWork, MdKey } from 'react-icons/md';

export default function PropertyStats({ bedrooms, bathrooms, square_meters, available_from, property_type, offering_type }) {
  const stats = [
    {
      icon: <MdOutlineBed className="text-xl text-terracotta-500" />,
      label: `${bedrooms} Bed`
    },
    {
      icon: <MdBathtub className="text-xl text-terracotta-500" />,
      label: `${bathrooms} Bath`
    },
  ];

  if (square_meters) {
    stats.push({
      icon: <MdSquareFoot className="text-xl text-terracotta-500" />,
      label: `${square_meters} m²`
    });
  }

  if (property_type) {
    stats.push({
      icon: <MdHomeWork className="text-xl text-terracotta-500" />,
      label: String(property_type).replaceAll('_', ' ')
    });
  }

  if (offering_type) {
    stats.push({
      icon: <MdKey className="text-xl text-terracotta-500" />,
      label: String(offering_type).replaceAll('_', ' ')
    });
  }

  if (available_from) {
    stats.push({
      icon: <MdCalendarToday className="text-xl text-terracotta-500" />,
      label: `Available ${new Date(available_from).toLocaleDateString()}`
    });
  }

  return (
    <div className="flex flex-wrap gap-4 py-6 border-y border-slate-200">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-2 text-slate-700">
          {stat.icon}
          <span className="font-medium">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
