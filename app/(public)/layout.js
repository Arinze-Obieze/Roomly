'use client';

import { FilterProvider } from "@/contexts/FilterContext";
import { PropertiesProvider } from "@/contexts/PropertiesContext";
import { SavedPropertiesProvider } from "@/contexts/SavedPropertiesContext";
import { ChatProvider } from "@/contexts/ChatContext";

export default function PublicLayout({ children }) {
  return (
    <FilterProvider>
      <PropertiesProvider>
        <SavedPropertiesProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </SavedPropertiesProvider>
      </PropertiesProvider>
    </FilterProvider>
  );
}
