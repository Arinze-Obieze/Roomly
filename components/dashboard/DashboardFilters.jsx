'use client';

import { useFilters } from "./filters/useFilters";

export default function DashboardFilters() {
  const { filters, updateFilters } = useFilters();
  
  const TABS = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'new', label: 'New' },
    { id: 'pass', label: 'Pass' }
  ];

  const handleTabChange = (tabId) => {
    updateFilters({ sortBy: tabId });
  };

  return (
    <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">

      {TABS.map((tab) => (
        <button 
          key={tab.id} 
          onClick={() => handleTabChange(tab.id)}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filters.sortBy === tab.id 
              ? 'bg-navy-900 text-white' 
              : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
