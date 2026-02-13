'use client';

import { MdOutlineBed, MdBathtub, MdSquareFoot, MdCalendarToday } from 'react-icons/md';

export default function PropertyStats({ bedrooms, bathrooms, square_meters, available_from }) {
  const stats = [
    {
      icon: <MdOutlineBed className="text-xl text-terracotta-500" />,
      label: `${bedrooms} Bed`
    },
    {
      icon: <MdBathtub className="text-xl text-terracotta-500" />,
      label: `${bathrooms} Bath`
    },
    {
      icon: <MdSquareFoot className="text-xl text-terracotta-500" />,
      label: `${square_meters} m²`
    },
    {
      icon: <MdCalendarToday className="text-xl text-terracotta-500" />,
      label: `Available ${new Date(available_from).toLocaleDateString()}`
    }
  ];

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
