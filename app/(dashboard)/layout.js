"use client";

import { FilterProvider } from "@/core/contexts/FilterContext";
import { PropertiesProvider } from "@/core/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/core/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/core/contexts/ChatContext";
import { usePathname } from "next/navigation";
import { 
  Header, 
  BottomNav
} from "@/components/dashboard";
import SidebarNav from "@/components/dashboard/layout/SidebarNav";

import { NotificationsProvider } from "@/core/contexts/NotificationsContext";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const hideMobileChrome = pathname?.startsWith("/listings/new");

  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            <NotificationsProvider>
              <div
                className={`min-h-screen bg-navy-50 font-sans text-navy-950 flex flex-col ${
                  hideMobileChrome ? "pb-0" : "pb-24 lg:pb-0"
                }`}
              >
              {/* Background Texture - Removed for clean theme */ }
  
              {hideMobileChrome ? (
                <div className="hidden lg:block">
                  <Header />
                </div>
              ) : (
                <Header />
              )}
  
              <div className="flex flex-1 max-w-[1920px] w-full mx-auto">
                 <SidebarNav />
                 
                 <div className="flex-1 min-w-0 flex flex-col">
                   {children}
                 </div>
              </div>
  
              {!hideMobileChrome && <BottomNav />}
            </div>
            </NotificationsProvider>
          </ChatProvider>
        </SavedPropertiesProvider>
      </PropertiesProvider>
    </FilterProvider>
  );
}
