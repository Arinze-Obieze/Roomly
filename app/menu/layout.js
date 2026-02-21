"use client";

import { FilterProvider } from "@/core/contexts/FilterContext";
import { PropertiesProvider } from "@/core/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/core/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/core/contexts/ChatContext";
import { NotificationsProvider } from "@/core/contexts/NotificationsContext";
import { Header, BottomNav } from "@/components/dashboard";

export default function MenuLayout({ children }) {
  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            <NotificationsProvider>
                  <div className="min-h-screen bg-gray-50 font-sans text-navy-950 pb-24 lg:pb-0">
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
