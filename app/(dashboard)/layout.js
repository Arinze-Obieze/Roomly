"use client";

import { FilterProvider } from "@/contexts/FilterContext";
import { PropertiesProvider } from "@/contexts/PropertiesContext";
import { 
  Header, 
  BottomNav,
  FilterModal 
} from "@/components/dashboard";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <FilterProvider>
      <PropertiesProvider>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {/* Background Texture */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
               style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

          <Header 
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Filter Modal (Mobile only) */}
          <FilterModal 
            isOpen={showFilters} 
            onClose={() => setShowFilters(false)}
          />

          {children}

          <BottomNav />
        </div>
      </PropertiesProvider>
    </FilterProvider>
  );
}