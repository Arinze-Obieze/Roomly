"use client";

import { FilterProvider } from "@/contexts/FilterContext";
import { PropertiesProvider } from "@/contexts/PropertiesContext";
import { 
  Header, 
  LeftSidebar, 
  RightSidebar, 
  BottomNav,
  FilterModal 
} from "@/components/dashboard";
import { useState } from "react";

export default function DashboardLayout({ children }) {
  const [activeTab, setActiveTab] = useState("discover");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <FilterProvider>
      <PropertiesProvider>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {/* Background Texture */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
               style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

          <Header 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Filter Modal (Mobile only) */}
          <FilterModal 
            isOpen={showFilters} 
            onClose={() => setShowFilters(false)}
          />

          <LeftSidebar />

          <main className="relative min-h-screen xl:pl-72 2xl:pr-80">
            {children}
          </main>

          <RightSidebar />
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </PropertiesProvider>
    </FilterProvider>
  );
}