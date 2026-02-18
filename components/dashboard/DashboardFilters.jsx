'use client';

import { useFilters } from "./filters/useFilters";
import { motion } from 'framer-motion';

export default function DashboardFilters() {
  const { filters, updateFilters } = useFilters();
  
  const TABS = [
    { id: 'recommended', label: 'Recommended', icon: '✨' },
    { id: 'new', label: 'Newest', icon: '🆕' },
    { id: 'price_low', label: 'Price: Low to High', icon: '💰' },
    { id: 'price_high', label: 'Price: High to Low', icon: '💎' },
    { id: 'match', label: 'Best Match', icon: '🤝' }
  ];

  const handleTabChange = (tabId) => {
    updateFilters({ sortBy: tabId });
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {TABS.map((tab) => {
        const isActive = filters.sortBy === tab.id || 
          (tab.id === 'recommended' && !filters.sortBy);
        
        return (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTabChange(tab.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-heading font-medium whitespace-nowrap transition-all ${
              isActive 
                ? 'bg-navy-950 text-white shadow-lg shadow-navy-950/20' 
                : 'bg-white border border-navy-200 text-navy-500 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}