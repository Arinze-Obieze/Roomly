"use client";

import { FilterProvider } from "@/contexts/FilterContext";
import { PropertiesProvider } from "@/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { 
  Header, 
  BottomNav
} from "@/components/dashboard";

import { NotificationsProvider } from "@/contexts/NotificationsContext";

export default function DashboardLayout({ children }) {

  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            <NotificationsProvider>
              <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 lg:pb-0">
              {/* Background Texture - Removed for clean theme */ }
  
              <Header />
  
              {children}
  
              <BottomNav />
            </div>
            </NotificationsProvider>
          </ChatProvider>
        </SavedPropertiesProvider>
      </PropertiesProvider>
    </FilterProvider>
  );
}