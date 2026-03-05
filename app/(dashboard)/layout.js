"use client";

import { FilterProvider } from "@/core/contexts/FilterContext";
import { PropertiesProvider } from "@/core/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/core/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/core/contexts/ChatContext";
import { 
  Header, 
  BottomNav
} from "@/components/dashboard";
import SidebarNav from "@/components/dashboard/layout/SidebarNav";

import { NotificationsProvider } from "@/core/contexts/NotificationsContext";

export default function DashboardLayout({ children }) {

  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            <NotificationsProvider>
              <div className="min-h-screen bg-navy-50 font-sans text-navy-950 pb-24 lg:pb-0 flex flex-col">
              {/* Background Texture - Removed for clean theme */ }
  
              <Header />
  
              <div className="flex flex-1 max-w-[1920px] w-full mx-auto">
                 <SidebarNav />
                 
                 <div className="flex-1 min-w-0 flex flex-col">
                   {children}
                 </div>
              </div>
  
              <BottomNav />
            </div>
            </NotificationsProvider>
          </ChatProvider>
        </SavedPropertiesProvider>
      </PropertiesProvider>
    </FilterProvider>
  );
}